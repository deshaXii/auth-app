import multer from 'multer'

const filename = ( req, file, next ) => {
    let lastIndexOf = file.originalname.lastIndexOf('.'),
        ext = file.originalname.substring(lastIndexOf)
    next(null, `img-${Date.now()}${ext}`)
}


const destination = ( req, file, next ) => {
    next(null, `${__dirname}/../uploads`)
}
const postImageDestination = ( req, file, next ) => {
    next(null, `${__dirname}/../uploads/posts-images`)
}


export const uploadPostImage = multer({
    storage: multer.diskStorage({
        destination: postImageDestination,
        filename
    })
})
const upload = multer({
    storage: multer.diskStorage({
        destination,
        filename
    })
})


export default upload