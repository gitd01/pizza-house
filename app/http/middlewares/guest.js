function guest(req,res,next){
    if(!req.isAuthenticated()){
        return next();
    }
    return res.redirect('/'); // if user is logged in then redirect to home page
}

module.exports=guest;