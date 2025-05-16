const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 使用内存存储积分榜数据
let leaderboard = [];

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 获取积分榜
app.get('/api/leaderboard', (req, res) => {
    console.log('Getting leaderboard:', leaderboard);
    res.json(leaderboard);
});

// 更新积分榜
app.post('/api/leaderboard', (req, res) => {
    const { name, score } = req.body;
    console.log('Updating leaderboard with:', { name, score });
    
    // 检查是否已存在该玩家的记录
    const existingIndex = leaderboard.findIndex(entry => entry.name === name);
    if (existingIndex !== -1) {
        // 如果新分数更高，则更新
        if (score > leaderboard[existingIndex].score) {
            console.log(`Updating score for ${name} from ${leaderboard[existingIndex].score} to ${score}`);
            leaderboard[existingIndex].score = score;
            leaderboard[existingIndex].date = new Date().toLocaleDateString();
        } else {
            console.log(`Score ${score} for ${name} is not higher than existing score ${leaderboard[existingIndex].score}`);
        }
    } else {
        // 添加新记录
        console.log(`Adding new player ${name} with score ${score}`);
        leaderboard.push({
            name,
            score,
            date: new Date().toLocaleDateString()
        });
    }
    
    // 按分数排序并只保留前10名
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    console.log('Updated leaderboard:', leaderboard);
    res.json(leaderboard);
});

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 