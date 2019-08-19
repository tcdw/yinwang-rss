#!/usr/bin/env node

const { JSDOM } = require('jsdom');
const request = require('request');
const RSS = require('rss');
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');

const printLog = (level, text) => {
    switch (level) {
        case 'info':
            console.log(`\x1b[1m\x1b[36m[INFO]\x1b[0m ${text}\x1b[0m`);
            break;
        case 'error':
            console.error(`\x1b[1m\x1b[35m[ERROR]\x1b[0m ${text}\x1b[0m`);
            break;
        default:
            return false;
    }
    return true;
};

const req = (url) => new Promise((resolve, reject) => {
    request({
        url,
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': `yinwang-rss/${version}`,
        },
    }, (e, response, body) => {
        if (!e && response.statusCode === 200) {
            resolve(new JSDOM(body, {
                referrer: url,
            }));
        } else if (!e) {
            reject(new ReferenceError(`Server returned ${response.statusCode}`));
        } else {
            reject(e);
        }
    });
});

if (process.argv[2] === 'help' || process.argv[2] === '-h') {
    console.log('Usage: yinwang-rss [PATH]');
    process.exit(0);
}
(async () => {
    const data = [];
    const rssData = [];
    const feed = new RSS({
        title: '当然我在扯淡',
        site_url: 'http://www.yinwang.org',
        pubDate: new Date().toISOString(),
    });
    let master;
    try {
        printLog('info', '正在下载文章目录');
        master = await req('http://www.yinwang.org');
    } catch (e) {
        printLog('error', e);
        process.exit(1);
    }
    const linkList = master.window.document.querySelector('.outer').querySelectorAll('a');
    for (let i = 0; i < linkList.length; i += 1) {
        data.push({
            title: linkList[i].textContent, url: linkList[i].href, run: false,
        });
    }

    const addItem = async (index, callback) => {
        printLog('info', `正在处理：${data[index].title}`);
        let slave;
        try {
            slave = await req(`http://www.yinwang.org${data[index].url}`);
        } catch (e) {
            printLog('error', e);
            process.exit(1);
        }
        const urlStruct = data[index].url.split('/');
        let description = '';
        try {
            const article = slave.window.document.querySelector('.inner');
            article.removeChild(article.childNodes[0]);
            article.removeChild(article.childNodes[0]);
            description = article.innerHTML;
        } catch (e) {
            printLog('error', e);
        }
        rssData.push({
            title: data[index].title,
            description,
            url: `http://www.yinwang.org${data[index].url}`,
            author: 'Yin Wang',
            date: `${urlStruct[2]}-${urlStruct[3]}-${urlStruct[4]}`,
            order: (urlStruct[2] * 10000) + (urlStruct[3] * 100) + (urlStruct[4]),
        });
        callback();
    };

    const runNextTask = () => {
        for (let i = 0; i < data.length; i += 1) {
            if (!data[i].run) {
                data[i].run = true;
                addItem(i, runNextTask);
                return false;
            }
        }
        const target = path.resolve(process.cwd(), process.argv[2] || `yinwang.${new Date().getTime()}.xml`);
        printLog('info', `正在输出 RSS Feed 到 ${target}`);
        rssData.sort((a, b) => b.order - a.order);
        for (let i = 0; i < rssData.length; i += 1) {
            feed.item(rssData[i]);
        }
        fs.writeFileSync(target, feed.xml(), { encoding: 'utf8' });
        process.exit(0);
        return false;
    };

    for (let i = 0; i < 6; i += 1) {
        runNextTask();
    }
})();
