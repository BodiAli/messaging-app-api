import multer from "multer";

const storage = multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 5242880 } });

export default upload;
