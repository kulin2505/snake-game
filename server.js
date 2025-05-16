const express = require('express');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 连接
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kulin2505:1234567890@cluster0.mongodb.net/snake-game?retryWrites=true&w=majority';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// 定义积分榜模型
const ScoreSchema = new mongoose.Schema({
    name: { type: String, required: true },
    score: { type: Number, required: true },
    date: { type: String, required: true }
});

const Score = mongoose.model('Score', ScoreSchema);

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 获取积分榜
app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        console.log('Getting leaderboard:', leaderboard);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        res.status(500).json({ error: 'Failed to get leaderboard' });
    }
});

// 更新积分榜
app.post('/api/leaderboard', async (req, res) => {
    try {
        const { name, score } = req.body;
        console.log('Updating leaderboard with:', { name, score });

        // 查找玩家现有记录
        const existingScore = await Score.findOne({ name });
        
        if (existingScore) {
            // 如果新分数更高，则更新
            if (score > existingScore.score) {
                console.log(`Updating score for ${name} from ${existingScore.score} to ${score}`);
                existingScore.score = score;
                existingScore.date = new Date().toLocaleDateString();
                await existingScore.save();
            } else {
                console.log(`Score ${score} for ${name} is not higher than existing score ${existingScore.score}`);
            }
        } else {
            // 添加新记录
            console.log(`Adding new player ${name} with score ${score}`);
            await Score.create({
                name,
                score,
                date: new Date().toLocaleDateString()
            });
        }

        // 获取更新后的积分榜
        const leaderboard = await Score.find()
            .sort({ score: -1 })
            .limit(10);
        
        console.log('Updated leaderboard:', leaderboard);
        res.json(leaderboard);
    } catch (error) {
        console.error('Error updating leaderboard:', error);
        res.status(500).json({ error: 'Failed to update leaderboard' });
    }
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 