const express = require("express")
const router = express.Router()
const multer = require("multer")
const { exec } = require("child_process")
const path = require("path")

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/")
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname)
  }
})

const upload = multer({ storage })

router.post("/", upload.single("video"), (req, res) => {

  const videoPath = req.file.path

  const scriptPath = path.join(__dirname, "../../ai-service/main.py")

  const command = `python "${scriptPath}" "${videoPath}"`

  exec(command, (error, stdout, stderr) => {

    if (error) {
      console.error(error)
      return res.status(500).json({ error: "AI failed" })
    }

    try {

      const result = JSON.parse(stdout)

      res.json(result)

    } catch (err) {

      res.json({
        message: "AI finished but returned invalid data"
      })

    }

  })

})

module.exports = router