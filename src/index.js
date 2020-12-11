/**
 * @time 2019/8/1
 */
const path = require('path');
const fetch = require('node-fetch');
const schedule = require('node-schedule');
const { default: ItChat4JS, EMIT_NAME, MESSAGE_TYPE, sendTextMsg, transmitMsg, sendFile, sendImage } = require('itchat4js');
const { directiveMap, taskMap, taskType, weekday } = require('./ConstValues');
const itChat4JSIns = new ItChat4JS();

const subscribeType = [
    MESSAGE_TYPE.TEXT,
    MESSAGE_TYPE.MAP,
    MESSAGE_TYPE.CARD,
    MESSAGE_TYPE.NOTE,
    MESSAGE_TYPE.SHARING,
    MESSAGE_TYPE.PICTURE,
    MESSAGE_TYPE.RECORDING,
    MESSAGE_TYPE.VOICE,
    MESSAGE_TYPE.ATTACHMENT,
    MESSAGE_TYPE.VIDEO,
    MESSAGE_TYPE.FRIENDS,
];


class HandleMainCountReplay {
    constructor(itChat4JSIns, mainCountName) {
        this.itChat4JSIns = itChat4JSIns;
        this.mainCountName = mainCountName;
        this.toUsername = '';
        this.toUsernameDesc = '';
        this.autoReplay = false;
    }

    async doReplay(msgInfo) {
        this.mainCountInfo = this.itChat4JSIns.getContactInfoByName(this.mainCountName) || {};
        const { type, text = '', filename, download, content = '', oriContent = '' } = msgInfo;

        const preText = text.trim().toUpperCase();

        if (preText.trim() === 'GET HELP') {
            const sendText = 'Help：\r\n' +
                '1、TO XXX: ---> 设置消息发送的好友，以‘TO ’开头（TO后有空格），以‘:’英文冒号结尾，XXX为好友备注，或别名\r\n' +
                '2、GET SEND FRIEND ---> 获取当前发送好友名称\r\n' +
                '3、GET FRIEND REQ ---> 获取好友申请列表\r\n' +
                '4、TF:X ---> 通过好友申请验证。X为好友序号\r\n' + '' +
                '5、GET FRIEND LIST ---> 获取好友列表\r\n' +
                '6、AUTO REPLAY 1---> 开启自动回复\r\n' +
                '7、AUTO REPLAY 0---> 关闭自动回复';
            await sendTextMsg(sendText, this.mainCountInfo.UserName);
            return;
        }

        if (preText.trim() === 'GET SEND FRIEND') {
            await sendTextMsg('Tip：\r\n' + (!!this.toUsername ? `当前发送好友为：${this.toUsernameDesc}` : '当前没有设置发送好友'), this.mainCountInfo.UserName);
            return;
        }

        if (preText.trim() === 'GET FRIEND REQ') {
            if (addFriendsReq.length > 0) {
                const textArr = addFriendsReq.map(({ NickName, Content }, index) => {
                    return `${index + 1}、${NickName}说：${Content}`
                });
                await sendTextMsg('好友申请列表：\r\n' + textArr.join('\r\n'), this.mainCountInfo.UserName);
            } else {
                await sendTextMsg(`TIP：\r\n 没有好友申请信息。`, this.mainCountInfo.UserName);
            }
            return;
        }

        if (preText.trim() === 'GET FRIEND LIST') {
            const list = itChat4JSIns.getContactInfoByName().sort((a, b) => a.PYQuanPin > b.PYQuanPin ? 1 : -1).map((i, id) => `${id + 1}、${i.RemarkName || i.NickName}`);
            await sendTextMsg('好友列表：\r\n' + list.join('\r\n'), this.mainCountInfo.UserName);
            return;
        }

        if (preText.trim().startsWith('AUTO REPLAY')) {
            const rest = preText.trim().replace(/AUTO REPLAY\s*/, '');
            let sendText = 'Tip：\r\n设置自动回复失败。';
            if (rest === '1' || rest === '0') {
                this.autoReplay = rest === '1';
                sendText = `Tip：\r\n${rest === '1' ? '开启' : '关闭'}自动回复`
            }
            await sendTextMsg(sendText, this.mainCountInfo.UserName);
            return;
        }


        if (preText.trim().startsWith('TO ')) {
            //设置发送好友
            const match = preText.match(/^TO (.*):\s*$/);
            if (match && match[1]) {
                const toUserInfo = this.itChat4JSIns.getContactInfoByName(match[1].trim());
                if (toUserInfo) {
                    this.toUsername = toUserInfo.UserName;
                    this.toUsernameDesc = toUserInfo.RemarkName || toUserInfo.NickName || '';
                    await sendTextMsg(`TIP：\r\n 设置发送好友'${match[1].trim()}'成功。`, this.mainCountInfo.UserName);
                } else {
                    await sendTextMsg(`TIP：\r\n 好友'${match[1].trim()}'不存在。`, this.mainCountInfo.UserName);
                }
            } else {
                await sendTextMsg(`TIP：\r\n 设置发送好友失败。发送‘get help’获取相关命令。`, this.mainCountInfo.UserName);
            }
            return;
        }

        if (preText.trim().toUpperCase().startsWith('TF:')) {
            const match = text.match(/^TF:(\d+)\s*$/);
            if (match && match[1]) {
                const index = +match[1] - 1;
                const friendReq = addFriendsReq[index];
                if (friendReq) {
                    const { status, verifyContent, UserName, NickName } = friendReq;
                    const ret = await this.itChat4JSIns.verifyFriend(UserName, status, verifyContent);
                    if (ret.BaseResponse && ret.BaseResponse.Ret === 0) {
                        await sendTextMsg(`TIP：\r\n 通过'${NickName}'好友申请成功。`, this.mainCountInfo.UserName);
                    } else {
                        await sendTextMsg(`TIP：\r\n 通过'${NickName}'好友申请失败。`, this.mainCountInfo.UserName);
                    }

                } else {
                    await sendTextMsg(`TIP：\r\n 没有好友请求信息。发送‘GET FRIEND REQ’获取好友申请列表。`, this.mainCountInfo.UserName);
                }
            } else {
                await sendTextMsg(`TIP：\r\n 验证好友请求失败。发送‘get help’获取相关命令。`, this.mainCountInfo.UserName);
            }
            return;
        }


        if (!this.toUsername) {
            await sendTextMsg(`TIP：\r\n 发送好友'${text}'不存在！请确认发送好友。`, this.mainCountInfo.UserName);
            return;
        }

        let ret = {};
        if (MESSAGE_TYPE.TEXT === type) {
            ret = await transmitMsg(text, type, this.toUsername);
        } else if ([MESSAGE_TYPE.PICTURE, MESSAGE_TYPE.VIDEO, MESSAGE_TYPE.MAP].indexOf(type) !== -1) {
            ret = await transmitMsg(MESSAGE_TYPE.MAP === type ? oriContent : content, type, this.toUsername);
        } else if (MESSAGE_TYPE.VOICE === type || MESSAGE_TYPE.ATTACHMENT === type) {
            //先下载，再发送
            const buffer = await download(null, null, true);
            const streamInfo = {
                fileReadStream: buffer,
                filename,
                extName: path.extname(filename)
            };
            ret = await sendFile(null, this.toUsername, null, streamInfo)
        }


        if (!ret.BaseResponse || ret.BaseResponse.Ret !== 0) {
            await sendTextMsg(`TIP：\r\n 发送消息失败，请重试。`, this.mainCountInfo.UserName);
        }


    }
}

const addFriendsReq = [];
const pushFriendReqToData = (reqInfo) => {
    const { UserName } = reqInfo;
    let index = addFriendsReq.findIndex(info => info.UserName === UserName);
    if (index !== -1) {
        addFriendsReq[index] = reqInfo;
    } else {
        addFriendsReq.push(reqInfo);
        index = addFriendsReq.length - 1
    }
    return index;
};

/**
 *
 * @param name 实际操作用户的username，remarkName或nickName
 * @returns {Promise<void>}
 */
const main = async (name) => {
    const handleMainCountReplayIns = new HandleMainCountReplay(itChat4JSIns, name);
    itChat4JSIns.listen(EMIT_NAME.CHAT_ROOM, subscribeType, async (msgInfo, toUserInfo) => {
        const { type, text = '', filename, download, content, oriContent, isAt } = msgInfo;
        if (!isAt) {
            return;
        }

        const { Self: { DisplayName, NickName }, UserName, NickName: chatRoomNickName } = toUserInfo;
        const retText = text.replace(`@${DisplayName || NickName}`, '').trim();
        const directive = directiveMap[chatRoomNickName] || {};
        if (retText === 'help' && !!directive['help']) {
            await sendTextMsg(directive['help'], UserName);
        } else if (retText === '1') {
            await sendImage('./image/east-city/house.jpg', UserName);
        } else {
            const msg = encodeURIComponent(retText);
            const { result, content: msgContent } = await fetch('http://api.qingyunke.com/api.php?key=free&appid=0&msg=' + msg).then(res => res.json());

            const retMsg = result === 0 ? (msgContent || '').replace(/{br}/g, '\r\n').replace('\r\n提示：按分类看笑话请发送“笑话分类”', '') : '不好意思我累了，让我休息下好吗？';

            await sendTextMsg(retMsg, UserName);
        }

    });
    itChat4JSIns.listen(EMIT_NAME.FRIEND, subscribeType, async (msgInfo, toUserInfo) => {
        const mainCountInfo = itChat4JSIns.getContactInfoByName(name) || {};
        const mainCountUsername = mainCountInfo.UserName;
        const { UserName, RemarkName, NickName } = toUserInfo;
        const { type, text, filename, download, content, oriContent } = msgInfo;


        if (mainCountUsername === UserName) {
            await handleMainCountReplayIns.doReplay(msgInfo);
            return;
        }
        let sendText = '';
        if (MESSAGE_TYPE.TEXT === type) {
            sendText = `${RemarkName || NickName}: \r\n ${text}`;
            await transmitMsg(sendText, type, mainCountInfo.UserName);
            if (handleMainCountReplayIns.autoReplay && handleMainCountReplayIns.toUsername) {
                const { result, content: msgContent } = await fetch('http://api.qingyunke.com/api.php?key=free&appid=0&msg=' + encodeURIComponent(text)).then(res => res.json());
                const retMsg = result === 0 ? (msgContent || '').replace(/{br}/g, '\r\n').replace('\r\n提示：按分类看笑话请发送“笑话分类”', '') : '';
                let tempText = `自动回复给‘${handleMainCountReplayIns.toUsernameDesc}’内容为：\r\n${retMsg}`;
                if (!retMsg) {
                    tempText = `自动回复‘${handleMainCountReplayIns.toUsernameDesc}’失败，请您回复。`
                }
                await sendTextMsg(retMsg, UserName);
                await sendTextMsg(tempText, mainCountInfo.UserName);
            }
        } else if (MESSAGE_TYPE.NOTE === type) {
            sendText = `Note: \r\n ${text}`;
            await transmitMsg(sendText, MESSAGE_TYPE.TEXT, mainCountInfo.UserName);
        } else if ([MESSAGE_TYPE.PICTURE, MESSAGE_TYPE.VIDEO, MESSAGE_TYPE.MAP].indexOf(type) !== -1) {
            await sendTextMsg(`${RemarkName || NickName}发来${type}:`, mainCountInfo.UserName);
            await transmitMsg(MESSAGE_TYPE.MAP === type ? oriContent : content, type, mainCountInfo.UserName);
        } else if (MESSAGE_TYPE.ATTACHMENT === type || MESSAGE_TYPE.VOICE === type) {
            await sendTextMsg(`${RemarkName || NickName}发来${type}:`, mainCountInfo.UserName);
            //先下载，再发送
            const buffer = await download(null, null, true);
            const streamInfo = {
                fileReadStream: buffer,
                filename,
                extName: path.extname(filename)
            };
            await sendFile(null, mainCountInfo.UserName, null, streamInfo)
        } else if (MESSAGE_TYPE.FRIENDS === type) {
            const { status, verifyContent, autoUpdate: { UserName, Content, NickName } } = text;
            const friendReqInfo = {
                status, verifyContent, UserName, Content, NickName
            };
            const index = pushFriendReqToData(friendReqInfo);
            await sendTextMsg(`好友请求\r\n用户：${NickName}\r\n内容：${Content}\r\n同意回复：‘TF:${index + 1}’`, mainCountInfo.UserName);
        } else {
            await sendTextMsg(`暂时不支持转发消息类型：${type}`, mainCountInfo.UserName);
        }

    });
    await itChat4JSIns.run();
    scheduleTask();
};


const fn = () => {
    try {
        main('比都个是还不你了对NIAN');
    } catch (e) {
        console.log(e);
    }
};
fn();

const fetchWeatherInfo = async () => {
    const url = 'https://ic.snssdk.com/stream/widget/goapi/local/weather/?en_city=nj';
    return new Promise(resolve => {
        fetch(url).then(res => res.json()).then(res => {
            if (res.message === 'success' && res.data && res.data.weather) {
                resolve(res.data.weather)
            } else {
                resolve(null);
            }
        }).catch(() => {
            resolve(null)
        })
    })

};

const scheduleTask = () => {
    Object.keys(taskMap).map(chatRoomName => {
        const taskInfo = taskMap[chatRoomName];
        const timeArr = Object.keys(taskInfo);
        timeArr.map(time => {
            schedule.scheduleJob(time, async () => {
                (taskInfo[time] || []).map(async info => {
                    const toUserInfo = itChat4JSIns.getContactInfoByName(chatRoomName);
                    if (info.type === taskType.weather) {
                        const ret = await fetchWeatherInfo();
                        if (ret) {
                            const now = convertDate();
                            const text = '南京市\r\n' +
                                `${now.substr(0, 10)} | ${weekday[new Date().getDay()]}\r\n` +
                                `${ret.day_condition}\r\n` +
                                `低温 ${ret.low_temperature}℃,高温 ${ret.high_temperature}℃\r\n` +
                                `${ret.wind_direction}${ret.wind_level}级\r\n\r\n` +
                                `温度 ${ret.current_temperature}℃\r\n` +
                                `空气质量: ${ret.quality_level}\r\n` +
                                `更新时间: ${now}`;
                            if (toUserInfo) {
                                await sendTextMsg(text, toUserInfo.UserName);
                            }
                        }
                    } else if (info.type === taskType.text) {
                        if (toUserInfo) {
                            let tempArr = info.text;
                            if (!Array.isArray(tempArr)) {
                                tempArr = [tempArr]
                            }
                            const promiseArr = tempArr.map(text => {
                                return () => sendTextMsg(text, toUserInfo.UserName);
                            });
                            //按顺序发送
                            await promiseArr.reduce((result, next) => {
                                return result.then(() => next())
                            }, Promise.resolve())
                        }
                    }
                })

            });
        });

    });
};


const convertDate = (date) => {
    date = date || new Date();
    return [date.getFullYear(), '-', ('00' + (date.getMonth() + 1)).slice(-2), '-', ('00' + date.getDate()).slice(-2), ' ', ('00' + date.getHours()).slice(-2), ':', ('00' + date.getMinutes()).slice(-2), ':', ('00' + date.getSeconds()).slice(-2)].join('')
};




