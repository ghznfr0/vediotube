import mongoose, {Schema} from 'mongoose'

const likeSchema = new Schema({
    tweet: {
        type: Schema.Types.ObjectId,
        ref: 'Tweet'
    },
    vedio: {
        type: Schema.Types.ObjectId,
        ref: 'Video'
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    },
    likedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }
}, {timestamps: true})

export const Like = mongoose.model('Like', likeSchema)