import { Router } from "express";
import { userAuth } from "../middlewares/auth-guard";
import { Post, User } from "../models";
import { uploadPostImage as uploader } from "../middlewares/uploader";
import { postValidation } from "../validators/post-validators";
import validator from "../middlewares/vaildator-middleware";
import { DOMAIN } from "../constants";
import generateSlug from "../functions/slug-generator";

const router = Router();

/**
 * @description To upload post image
 * @access Private
 * @api /posts/api/post-image-upload
 * @type POST
 */
router.post(
    "/api/post-image-upload",
    userAuth,
    uploader.single("image"),
    async (req, res) => {
        try {
            let { file } = req;
            console.log(file.filename);
            let filename = DOMAIN + "posts-images/" + file.filename;
            return res.status(200).json({
                success: true,
                filename,
                message: "image uploaded successfully.",
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Unable to create the post.",
            });
        }
    }
);

/**
 * @description To create a new post by the authenticated user
 * @access Private
 * @api /posts/api/create-post
 * @type POST
 */
router.post(
    "/api/create-post",
    userAuth,
    postValidation,
    validator,
    async (req, res) => {
        try {
            let { body } = req;
            let post = new Post({
                author: req.user._id,
                ...body,
                slug: generateSlug(body.title),
            });
            await post.save();
            return res.status(201).json({
                success: true,
                post,
                message: "Your post is published.",
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Unable to create the post.",
            });
        }
    }
);

/**
 * @description To updatte post
 * @access Private
 * @api /posts/api/update-post
 * @type PUT
 */
router.put(
    "/api/update-post/:id",
    userAuth,
    postValidation,
    validator,
    async (req, res) => {
        try {
            let { id } = req.params;
            let { user, body } = req;
            let post = await Post.findById(id);
            if (!post) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found.",
                });
            }
            if (post.author.toString() !== user._id.toString()) {
                return res.status(401).json({
                    success: false,
                    message: "Post does't belong to you.",
                });
            }
            post = await Post.findOneAndUpdate(
                { author: user._id, _id: id },
                {
                    ...body,
                    slug: generateSlug(body.title),
                },
                { new: true }
            );
            return res.status(200).json({
                success: false,
                post,
                message: "Post updated successfully.",
            });
        } catch (err) {
            return res.status(400).json({
                success: false,
                message: "Unable to update the post.",
            });
        }
    }
);


/**
 * @description To like post
 * @access Private
 * @api /posts/api/like-post/:id
 * @type PUT
 */
router.put('/api/like-post/:id', userAuth, async (req, res) => {
    try {
        let { id } = req.params
        let post = await Post.findById(id)
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found.",
            });
        }
        
        let user = post.likes.users.map(id => id.toString())
        if (user.includes(req.user._id.toString())) {
            return res.status(404).json({
                success: false,
                message: "You already like this post.",
            });
        }
        post = await Post.findOneAndUpdate({_id: id}, {
            likes: {count: post.likes.count + 1, users: [...post.likes.users, req.user._id]}
        }, { new: true })
        return res.status(200).json({
            success: true,
            message: "You liked this post.",
        });
    } catch (err) {
        return res.status(400).json({
            success: false,
            message: "Unable to like the post.",
        });
    }
})




export default router;
