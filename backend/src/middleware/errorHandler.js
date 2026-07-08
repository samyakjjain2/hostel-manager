const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.message || err);
  
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Catch Prisma unique constraint violations (P2002)
  if (err.code === 'P2002') {
    statusCode = 409; // Conflict
    const target = err.meta?.target || [];
    if (target.includes('hostelId') && target.includes('roomNumber')) {
      message = 'This room number has already been registered in this hostel branch.';
    } else if (target.includes('email')) {
      message = 'A profile with this email address has already been registered.';
    } else if (target.includes('enrollmentNumber')) {
      message = 'A student with this enrollment / roll number has already been registered.';
    } else {
      message = `Record already exists. Unique constraint failed on: ${target.join(', ')}`;
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

const createError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

module.exports = { errorHandler, createError };
