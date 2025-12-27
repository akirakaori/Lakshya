import { toast} from 'react-toastify';

export const handleSuccess = (msg:string|number) =>{
    toast.success(msg,{
        position:"top-right",
    });
};

export const handleError = (msg:string|number) => {
    toast.error(msg,{
        position:"top-right",
    });
};