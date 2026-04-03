import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const createPdfUpload = (folder) => {
    const uploadDir = path.join(__dirname, `../../uploads/${folder}`);
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const storage = multer.diskStorage({
        destination: (_req, _file, cb) => cb(null, uploadDir),
        filename: (_req, file, cb) => {
            const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${unique}${path.extname(file.originalname)}`);
        },
    });

    return multer({
        storage,
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    });
};

const fileFilter = (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
        cb(null, true);
    } else {
        cb(new Error("Only PDF files are allowed"), false);
    }
};

export const uploadOrgDoc = createPdfUpload("org-docs").single("document");

export const uploadStudentCv = createPdfUpload("student-cvs").single("cv");
