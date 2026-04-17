const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
        user: '2772524169@qq.com',
        pass: 'mtxyffdlowhuddai'
    }
});

// 验证码存储（生产环境建议用Redis，这里用内存Map）
const codeStore = new Map();
const CODE_EXPIRE = 5 * 60 * 1000; // 5分钟过期

/**
 * 发送邮箱验证码
 * @param {string} email - 目标邮箱
 * @returns {object} { success, message }
 */
async function sendCode(email) {
    // 验证邮箱格式
    const emailReg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailReg.test(email)) {
        return { success: false, message: '邮箱格式不正确' };
    }

    // 防止频繁发送（1分钟内只能发一次）
    const last = codeStore.get(email);
    if (last && Date.now() - last.time < 60 * 1000) {
        const remain = Math.ceil((60 * 1000 - (Date.now() - last.time)) / 1000);
        return { success: false, message: `请${remain}秒后再试` };
    }

    // 生成6位验证码
    const code = String(Math.floor(100000 + Math.random() * 900000));

    try {
        await transporter.sendMail({
            from: `"心光宇宙" <2772524169@qq.com>`,
            to: email,
            subject: '心光宇宙 · 验证码',
            html: `
                <div style="background:#0a0a1a;padding:2rem;border-radius:12px;max-width:400px;margin:0 auto;font-family:sans-serif;">
                    <h2 style="color:#e0c868;margin-bottom:0.5rem;">心光宇宙</h2>
                    <p style="color:#b0aca4;font-size:0.9rem;">你的验证码是：</p>
                    <div style="background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:1rem;text-align:center;margin:1rem 0;">
                        <span style="font-size:2rem;color:#e0c868;letter-spacing:8px;font-weight:bold;">${code}</span>
                    </div>
                    <p style="color:#8a8680;font-size:0.8rem;">验证码5分钟内有效，请勿泄露给他人。</p>
                </div>
            `
        });

        // 存储验证码
        codeStore.set(email, { code, time: Date.now() });

        return { success: true, message: '验证码已发送' };
    } catch (err) {
        console.error('[发送邮件错误]', err);
        return { success: false, message: '发送失败，请稍后重试' };
    }
}

/**
 * 验证邮箱验证码
 * @param {string} email
 * @param {string} code
 * @returns {boolean}
 */
function verifyCode(email, code) {
    const record = codeStore.get(email);
    if (!record) return false;
    if (Date.now() - record.time > CODE_EXPIRE) {
        codeStore.delete(email);
        return false;
    }
    if (record.code !== code) return false;
    codeStore.delete(email); // 验证成功后删除
    return true;
}

module.exports = { sendCode, verifyCode };
