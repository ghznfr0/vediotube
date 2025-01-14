import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body

    if(!title || !description) {
        throw new ApiError(401, "Title and description are required!")
    }

    const owner = req.user?._id
    if(!owner) {
        throw new ApiError(404, "Unauthorized! user must me login to publish a video!")
    }

    const videoFileLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoFileLocalPath) {
        throw new ApiError(401, "vedio not uploaded locally through multer")
    }

    if(!thumbnailLocalPath) {
        throw new ApiError(401, "thumbnail not uploaded locally through multer")
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        owner,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url
    })
    
    return res
    .status(201)
    .json(
        new ApiResponse(201, video, "Video created successfully!")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const video = await Video.findById(videoId)
    if(!video) {
        throw new ApiError(401, "Video not available!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "Desired video fetched successfully!")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    const thumbnailLocalPath = req.file?.path

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!(title, description, thumbnail)) {
        throw new ApiError(402, "At least one field is required!")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, 
        {
            $set: {
                title: title || "",
                description: description || "",
                thumbnail: thumbnail.url || ""
            }
        }, {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateVideo, "Video details updated successfully!")
    )
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(402, "video id is invalid or empty!")
    }
    
    await Video.findByIdAndDelete(videoId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Video deleted successfully!")
    )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(401, "Video id is Invalid or empty!")
    }

    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(500, "Video not found!")
    }

    video.isPublished = !video.isPublished

    await video.save({validateBeforeSave: false})

    return res.status(200).json(
        new ApiResponse(200, { isPublished: video.isPublished }, "Publish status updated successfully!")
    );
})

// const getAllVideos = asyncHandler(async (req, res) => {
//     const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     //TODO: get all videos based on query, sort, pagination
// })

export {
    publishAVideo,
    // getAllVideos,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
