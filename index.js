const express = require('express');
const fs= require('fs');
const multer =require('multer');
const path = require('path');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
require('dotenv').config(); 
// const PORT =5000;
const app=express()
app.use(cors({ origin: "*" }));
app.use(express.json());

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});



// const storage=multer.diskStorage({
//     destination:(req,res,cb)=>{
//         cb(null,'./uploads');
//     },
//     filename:(req,file,cb)=>{
//         cb(null,Date.now()+path.extname(file.originalname));
//     }
// });
// const upload=multer({storage})

const upload = multer({ dest: 'uploads/' });
/** Store video in uplaods folder */

app.post('/api/uploads',upload.single('video'),async(req,res)=>{
    
    console.log('React');
    
    if(!req.file){
        return res.status(400).send(`No file found..`);
    }
    try {
        // Upload the video to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'video', // Specify it's a video
            folder: 'videos' // Cloudinary folder
        });

        // Delete the temp file
        fs.unlinkSync(req.file.path);

        res.json({ videoUrl: result.secure_url });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload video' });
    }
})

/*** get video */ 
app.get('/video/:filename',(req,res)=>{
    const videoPath =path.join(__dirname,"uploads",req.params.filename);
    if(!fs.existsSync(videoPath)){
        return res.status(400).send('Video Not Found');
    }
    const videoStat = fs.statSync(videoPath);
    const fileSize = videoStat.size;
    const range = req.headers.range;

    if (!range) {
        return res.status(416).send("Requires Range header");
    }
    const CHUNK_SIZE = 10 ** 6;
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, fileSize - 1);
    const contentLength = end - start + 1;

    const headers = {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    const videoStream = fs.createReadStream(videoPath, { start, end });
    videoStream.pipe(res);

})
/** test URL */
app.get('/',(req,res)=>{
    res.end("<h1>Base Directory</h1>")
})
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
//   });

module.exports = app;