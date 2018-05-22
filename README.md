# 垠神 RSS

为王垠的 [博客](http://www.yinwang.org) 添加 RSS Feed！

## 用法

```bash
npm install -g git+https://github.com/tcdw/yinwang-rss
```

然后检查 yinwang-rss 在哪里：

```bash
$ which yinwang-rss
/usr/local/bin/yinwang-rss
```

然后设置 cron：

```
*/30 * * * * /usr/local/bin/node /usr/local/bin/yinwang-rss /var/www/rss/yinwang.xml &> /tmp/yinwang.log
```
