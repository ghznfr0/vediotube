import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name || !description) {
        throw new ApiError(400, "Name and description are required!");
    }
    const owner = req.user?._id
    if (!owner) {
        throw new ApiError(401, "Unauthorized. Please log in to create a playlist.");
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully!")
    );
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(402, "User ID is missing or invalid!");
    }

    const userPlaylists = await Playlist.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users", // Ensure collection name matches exactly
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind: "$ownerDetails"
        },
        {
            $group: {
                _id: "$ownerDetails._id",
                playlists: { $push: "$name" }
            }
        }
    ]);

    if (userPlaylists.length === 0) {
        console.error("No playlists found for userId:", userId);
        throw new ApiError(404, "No playlists found for the specified user!");
    }

    return res.status(200).json(
        new ApiResponse(200, userPlaylists[0], "Playlists retrieved successfully!")
    );
});


const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist = await Playlist.findById(playlistId)

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Play list fetched successfully!")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId) {
        throw new ApiError(402, "playlistId and videoId are required!")
    }


   const playlist =  await Playlist.findById(playlistId)
   
   if(!playlist) {
    throw new ApiError(500, "Playlist not found!")
}

    if(playlist.videos.includes(videoId)) {
        throw new ApiError(409, "Video already exist in the playlist!")
    }

    playlist.videos.push(videoId)

    await playlist.save({validateBeforeSave: false})

    

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Added video to playlist successfully!")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !videoId) {
        throw new ApiError(401, "playlist and video ids are required!")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist.videos.includes(videoId)) {
        throw new ApiError(500, "This video is not available in this playlist!")
    }

    playlist.videos.pop(videoId)

    const removed = await playlist.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, removed, "Video removed successfully")
    )


})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    await Playlist.findByIdAndDelete(playlistId)
    return res.status(202).json(
        new ApiResponse(202, {}, "Playlist updated successfully!")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId) {
        throw new ApiError(404, "Playlist not found!")
    }

    if(!name || !description) {
        throw new ApiError(402, "name and description is required to update playlist!")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name,
                description
            }
        }, {new: true}
    )

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "playlist Updated successfully!")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
