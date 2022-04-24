import express ,{NextFunction, Router}from 'express';
import {CustomRequest,CustomResponse} from '../interface/CustomRequestAndRespons';
import bcrypt from 'bcrypt';
import { User, UserModel } from '../database/user';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import { userHandler, UserRequset } from '../middleware/userHandler';
import { CustomError } from '../middleware/errorHandler';
import { ClassModel } from '../database/class';


const router:Router=express.Router();

router.get('/',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try { 
        if(!req.user)return next(new CustomError('No User',404));
        const user=await UserModel.findOne({id:req.user.id},'-_id -password -refreshtoken');
        if(!user)return next(new CustomError('No User',404));
        return res.status(200).json({...user.toObject(),accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})
interface classResponseInterface{
    id:string,
    name:string,
    createdAt:string,
    teacher:string,
    studentCount:number,
    recordCount:number
}
router.get('/class',userHandler,async(req:UserRequset,res:CustomResponse,next:NextFunction)=>{
    try {
        if(!req.user)return next(new CustomError('No User',404));
        const classes=await ClassModel.find({ teachers: { $elemMatch:{ $eq:req.user.id} } }  ,'-_id -__v');
        const resData:Array<classResponseInterface>=classes.map(c=>{
            const data:classResponseInterface={
                id:c.id,name:c.name,teacher:c.teachers[0],createdAt:new Date().toString(),
                recordCount:c.attendanceArray.length,
                studentCount:c.students.length
            }
            return data;
        })
        return res.status(200).json({classes:resData,accesstoken:req.accesstoken});
    } catch (error) {
        next(error);
    }
})

export default router;