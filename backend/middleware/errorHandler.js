export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Multer-specific errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: 'File too large',
      message: 'Maximum file size exceeded'
    });
  }
  
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      error: 'Too many files',
      message: 'Maximum number of files exceeded'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.error || 'Internal server error',
    message: err.message
  });
};

export default errorHandler;
