/**
 * @time 2019/8/15
 */
const charRoomName = {
    cityEast: '银亿东城九街区的朋友们',
    test: '这是一个测试名称'
};
const helpDirective = '已支持的命令：\r\n' +
    '1如何办理房产证\r\n' +
    '2待完善';
const directiveMap = {
    [charRoomName.cityEast]: {
        help: helpDirective,
    },
    [charRoomName.test]: {
        help: helpDirective,
    },

};

const taskType = {
    test: 'test',
    weather: 'weather'
};

const taskMap = {
    [charRoomName.test]: {
        '0 0 7 * * *': [taskType.weather]
    },
};

const weekday=["星期日","星期一","星期二","星期三","星期四","星期五","星期六"];

module.exports = {
    directiveMap,
    taskMap,
    taskType,
    weekday
};