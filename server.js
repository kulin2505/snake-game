const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 存储积分榜数据
let leaderboard = [];

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 获取积分榜
app.get('/api/leaderboard', (req, res) => {
    res.json(leaderboard);
});

// 更新积分榜
app.post('/api/leaderboard', (req, res) => {
    const { name, score } = req.body;
    
    // 添加新记录
    leaderboard.push({
        name,
        score,
        date: new Date().toLocaleDateString()
    });
    
    // 按分数排序并只保留前10名
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
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