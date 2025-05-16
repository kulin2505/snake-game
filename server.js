const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const LEADERBOARD_FILE = path.join(__dirname, 'leaderboard.json');

// 初始化积分榜文件
if (!fs.existsSync(LEADERBOARD_FILE)) {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify([]));
}

// 读取积分榜数据
function readLeaderboard() {
    try {
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading leaderboard:', error);
        return [];
    }
}

// 保存积分榜数据
function saveLeaderboard(leaderboard) {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2));
    } catch (error) {
        console.error('Error saving leaderboard:', error);
    }
}

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// 获取积分榜
app.get('/api/leaderboard', (req, res) => {
    const leaderboard = readLeaderboard();
    res.json(leaderboard);
});

// 更新积分榜
app.post('/api/leaderboard', (req, res) => {
    const { name, score } = req.body;
    let leaderboard = readLeaderboard();
    
    // 检查是否已存在该玩家的记录
    const existingIndex = leaderboard.findIndex(entry => entry.name === name);
    if (existingIndex !== -1) {
        // 如果新分数更高，则更新
        if (score > leaderboard[existingIndex].score) {
            leaderboard[existingIndex].score = score;
            leaderboard[existingIndex].date = new Date().toLocaleDateString();
        }
    } else {
        // 添加新记录
        leaderboard.push({
            name,
            score,
            date: new Date().toLocaleDateString()
        });
    }
    
    // 按分数排序并只保留前10名
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 10);
    
    // 保存更新后的积分榜
    saveLeaderboard(leaderboard);
    
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