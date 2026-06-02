const errorHandler = (err, req, res, next) => { 
  console.error(err.stack); 
  const statusCode = err.statusCode || 500; 
  res.status(statusCode).json({ 
    error: err.message || "Server Error", 
    details: process.env.NODE_ENV === "development" ? err.stack : undefined 
  }); 
}; 
 
export default errorHandler; 
