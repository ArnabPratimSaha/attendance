import express ,{NextFunction,Request,Response, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import { User, UserModel } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassModel } from '../database/class';
import { teacherRequest, teacherHandler } from '../middleware/teacherHandler';
import { StudentModel } from '../database/student';


const router:Router=express.Router();

router.get('/',async(req:CustomRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.query.id?.toString().trim();
        const cid:string|undefined=req.query.cid?.toString().trim();
        if(!id || !cid)return next(new CustomError('cid or id missing',400));
        const student=await StudentModel.findOne({id:id},'-_id -__v');
        const classData=await ClassModel.findOne({id:cid},'-_id -__v');
        if(!student)return next(new CustomError('Student not found',404));
        if(!classData)return next(new CustomError('Class not found',404));
        res.status(200).json({ ...student.toObject(),attendenceDate:classData.attendanceArray,teachers:classData.teachers });
    } catch (error) {
        next(error);
    }
})
router.post('/',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        if( !name || !roll)return next(new CustomError('missing field name or roll',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=new StudentModel({
            id:uuidv4(),
            name:name,
            roll:roll,
            classId:req.classData.id,
            attendanceArray:new Array<boolean>(req.classData.attendanceArray.length).fill(false),
        });
        const classData=await ClassModel.findOne({id:req.classData.id});
        if(!classData)return next('No Class found');
        await student.save();
        classData.students.push(student.id);
        await classData.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
router.patch('/',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const name:string|undefined=req.body.name;
        const roll:string|undefined=req.body.roll;
        const id:string|undefined=req.body.id;
        if( !name || !roll ||  !id)return next(new CustomError('missing field name or roll or id',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const student=await StudentModel.findOne({id:id});
        if(!student)return next(new CustomError('Student not found',404));
        student.name=name;
        student.roll=roll;
        await student.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
router.delete('/',userHandler,teacherHandler,async(req:teacherRequest,res:CustomResponse,next:NextFunction)=>{
    try {
        const id:string|undefined=req.body.id;
        if(!id)return next(new CustomError('missing field id',400));
        if(!req.classData)return next(new CustomError('Class not found',404));
        const classData=await ClassModel.findOne({id:req.classData.id});
        if(!classData)return next('No Class found');
        const student=await StudentModel.findOneAndDelete({id:id});
        if(!student)return next(new CustomError('Student not found',404));
        classData.students=classData.students.filter(i=>i!==student.id);
        await classData.save();
        return res.status(200).json({ ...student.toObject(),accesstoken:req.accesstoken })
    } catch (error) {
        next(error);
    }
})
export default router;