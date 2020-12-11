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
    weather: 'weather',
    text: 'text'
};

const complaintText = '市委书记信箱：http://221.226.86.73:8088/nj_ldxx/mailBoxController/toWriteLetter.do \n' +
    '标题：望张书记牵头相关部门落实经十一路建设\n' +
    '张书记您好！我是居住在银亿东城（即东郊小镇第九至十二街区）小区的一位市民。我们小区为城东紫东地区的超级大盘，小区受高速高铁山体的物理阻隔以及其他诸多原因，没有一条正规通外道路，每每堵在小区内部过长时间难出。出了小区前往灵山地铁站，仅靠一条解放前修建但仍在“服役”的麒龙路出行，正儿八经经历“第二堵”，更为无语的是，宽幅小的道路人车混行，渣土车肆意穿行，交通事故不断，老百姓安全丝毫得不到保障，出行成本高且异常艰难。小区人口量大，上下班选择地铁出行的人数居多，但苦于没有一条正规的市政道路通达地铁站。如今，灵山地铁站附近的仙林副城麒麟片区规划已经公布，规划的经十一路（银亿东城十街区东侧麒麟枢纽西侧下穿沪宁高速连通麒麟片区的市政道路）直达灵山地铁站，如果该条道路能够快速修建，能最好的解决小区的出行难问题，但该条道路可能牵涉到麒麟高新区、沪宁公司、江宁区、地铁小镇四家建设单位，难以在短期内开建。当前，随着小区入住率逐渐攀升，交通拥堵问题愈发严重。望张书记能替老百姓做主，指定牵头部门督促该条道路尽快落实开建，以解决小区长期以来出行不便的顽症，非常感谢！';

const taskMap = {
    [charRoomName.test]: {
        '0 0 7 * * *': [{ type: taskType.weather }],
        '1 0 7 * * *': [{
            type: taskType.text, text: [complaintText, '大家帮忙反应下，谢谢']
        }],
    },
    [charRoomName.cityEast]: {
        '0 0 7 * * *': [{ type: taskType.weather }],
        '1 0 7 * * *': [{
            type: taskType.text, text: [complaintText, '大家帮忙反应下，谢谢']
        }],
    },
};

const weekday = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

module.exports = {
    directiveMap,
    taskMap,
    taskType,
    weekday
};