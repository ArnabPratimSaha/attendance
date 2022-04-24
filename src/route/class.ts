
import express ,{NextFunction,Request,Response, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import { User, UserModel } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassModel } from '../database/class';
import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
import { Student, StudentModel } from '../database/student';


const router:Router=express.Router();

router.post('/',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const name:string|undefined=req.body.name;
        if(!name)return next(new CustomError('Class name field missing'));
        const newClass=new ClassModel({
            id:uuidv4(),
            name:name,
            teachers:[req.user.id],
            students:[],
            attendanceArray:[],
            attendanceCount:[]
        })
        await newClass.save();
        return res.status(200).json({ ...newClass.toObject(),accesstoken:req.accesstoken });
    } catch (error) {
        next(error);
    }
})

router.get('/col',async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const index:string|undefined=req.query.index?.toString();
        const cid:string|undefined=req.query.cid?.toString();
        if(!index||!cid)return next(new CustomError('missing cid or index',400));
        const classData=await ClassModel.findOne({id:cid});
        if(!classData)return next(new CustomError('Not class found',404));
        const students=await StudentModel.find({classId:cid});
        if(+index>=classData.attendanceArray.length)return next(new CustomError('index out of bound',400));
        interface StudentIndividualData{
            id:string,
            name:string,roll:string,
            remark:boolean
        }
        interface DateAttendance{
            id:string,
            date:Date,
            name:string,
            students:Array<StudentIndividualData>,
            teachers:Array<string>
        }
        const sendData:DateAttendance={
            id:classData.id,
            name:classData.name,
            date:classData.attendanceArray[+index],
            students:students.map(s=>{
                const stu:StudentIndividualData={
                    id:s.id,name:s.name,roll:s.roll,remark:s.attendanceArray[+index]
                }
                return stu;
            }),
            teachers:classData.teachers
        }
        return res.status(200).json({...sendData})
    } catch (error) {
        next(error);
    }
})
router.post('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const time:Date|undefined=req.body.time?new Date(req.body.time):undefined;
        if(!time)return next(new CustomError('time is missing'));
        const classData=await ClassModel.findOne({id:req.classData?.id});
        if(!classData)return next(new CustomError('No Class found',404));
        classData.attendanceArray.push(time);
        const response=await StudentModel.updateMany({classId:classData.id},{ $push:{ attendanceArray: false }});
        if(!response.acknowledged)return next(new CustomError('Data is not ACK',500,false));
        await classData.save();
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})
router.patch('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const index:number|undefined=req.body.index;
        const studentId:string|undefined=req.body.sid;
        const remark:boolean|undefined=req.body.remark;
        if(index===undefined || !studentId  || remark===undefined)return next(new CustomError('index or sid or remark missing',400));
        const classData=await ClassModel.findOne({id:req.classData?.id});
        if(!classData)return next(new CustomError('No Class found',404));
        if(index>=classData.attendanceArray.length)return next(new CustomError('index out of bound',400));
        const student=await StudentModel.findOne({id:studentId,classId:classData.id});
        if(!student)return next(new CustomError('Student not found',404));
        student.attendanceArray[index]=remark;
        await student.save();
        await classData.save();
        return res.status(200).json({accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
});
router.delete('/col',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const index:string|undefined=req.body.index;
        if(index===undefined)return next(new CustomError('missing index',400));
        const classData=await ClassModel.findOne({id:req.classData?.id});
        if(!classData)return next(new CustomError('No Class found',404));
        if(+index>=classData.attendanceArray.length)return next(new CustomError('index out of bound',400));
        classData.attendanceArray=classData.attendanceArray.filter((c,i)=>i!==+index);
        const students=await StudentModel.find({classId:classData.id})
        for(let i=0;i<students.length;i++){
            students[i].attendanceArray=students[i].attendanceArray.filter((a,i)=>i!==+index)
            await students[i].save();
        }        
        await classData.save();
        return res.sendStatus(200)
    } catch (error) {
        next(error);
    }
})
router.get('/',async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const classId:string|undefined=req.query.cid?.toString();
        if(!classId)return next(new CustomError('Class id missing'));
        const classData=await ClassModel.findOne({id:classId},'-_id -students -__v');
        if(!classData)return next(new CustomError('No Such class found'));
        const students=await StudentModel.find({classId:classData.id},'-_id -classId -__v');
        return res.status(200).json({
            ...classData.toObject(),
            students:students,
        });
    } catch (error) {
        next(error);
    }
})
router.delete('/',async(req:Request,res:Response,next:NextFunction)=>{
    try {
        const classId:string|undefined=req.body.cid;
        if(!classId)return next(new CustomError('Class id missing'));
        const classData=await ClassModel.findOneAndDelete({id:classId});
        if(!classData)return next(new CustomError('No Such class found'));
        const response=await StudentModel.deleteMany({classId:classData.id});
        if (!response.acknowledged) {
            return next(new CustomError('mongodb error', 500, false))
        }
        return res.sendStatus(200);
    } catch (error) {
        next(error);
    }
})

export default router;