const errorHandler = (err, req, res, next) => {
  if (err.status) {
    res.status(err.status).json({ message: `Error: ${err.message}` });
  } else {
    res.status(500).json({ message: `Error: ${err.message}` });
  }
};

export default errorHandler;
