/**
 * @time 2019/8/1
 */

const path = require('path');
const { default: ItChat4JS, EMIT_NAME, MESSAGE_TYPE, sendTextMsg, transmitMsg, sendFile } = require('itchat4js');
const itChat4JSIns = new ItChat4JS();

let mainCountInfo = null;

class HandleMainCountReplay {
    constructor(itChat4JSIns, mainCountName) {
        this.itChat4JSIns = itChat4JSIns;
        this.mainCountName = mainCountName;
        this.toUsername = '';
    }

    async doReplay(msgInfo) {
        this.mainCountInfo = this.mainCountInfo || this.itChat4JSIns.getContactInfoByName(this.mainCountName) || {};
        const { type, text = '', filename, download, content = '', oriContent = '' } = msgInfo;

        if (text === 'get help') {
            const sendText = 'Help：\r\n' +
                '1、TO XXX: ---> 设置消息发送的好友，以‘TO ’开头（TO后有空格），以‘:’英文冒号结尾，XXX为好友备注，或别名';
            await sendTextMsg(sendText, mainCountInfo.UserName);
            return;
        }

        const match = text.match(/^TO (.*):\s*$/);
        if (match && match[1]) {
            const toUserInfo = this.itChat4JSIns.getContactInfoByName(match[1].trim());
            if (toUserInfo) {
                this.toUsername = toUserInfo.UserName;
                await sendTextMsg(`TIP: \r\n 设置发送好友'${match[1].trim()}'成功。`, mainCountInfo.UserName);
            }
            return;
        }
        if (!this.toUsername) {
            await sendTextMsg(`TIP: \r\n 发送好友'${text}'不存在！请确认发送好友。`, mainCountInfo.UserName);
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
            await sendTextMsg(`TIP: \r\n 发送消息失败，请重试。`, mainCountInfo.UserName);
        }


    }
}

const arr = [
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

/**
 *
 * @param name 实际操作用户的username，remarkName或nickName
 * @returns {Promise<void>}
 */
const main = async (name) => {
    const handleMainCountReplayIns = new HandleMainCountReplay(itChat4JSIns, name);
    itChat4JSIns.listen(EMIT_NAME.CHAT_ROOM, null, (msgInfo, toUserInfo) => {
        console.log(msgInfo)
    });
    itChat4JSIns.listen(EMIT_NAME.FRIEND, arr, async (msgInfo, toUserInfo) => {
        mainCountInfo = mainCountInfo || itChat4JSIns.getContactInfoByName(name) || {};
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
        } else {
            await sendTextMsg(`暂时不支持转发消息类型：${type}`, mainCountInfo.UserName);
        }

    });
    await itChat4JSIns.run();
    mainCountInfo = itChat4JSIns.getContactInfoByName(name);
};

main('比都个是还不你了对NIAN');

