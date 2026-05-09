# 安装与迁移

## 全新安装

```bash
cd ~/.openclaw/plugins
git clone https://github.com/taobaoaz/yaoyao-soul.git
```

然后在 `openclaw.yaml` 中启用：

```yaml
plugins:
  yaoyao-soul:
    # 默认读取同目录下的 memory/，通常不用额外配置
```

重启 Gateway 即可。

## 从集合版迁移

如果你之前安装的是 `yaoyao-plugin` v1.4.0 或更早（单仓库含全部功能），请先阅读 plugin 仓库的迁移指南：

📖 **[完整迁移指南](https://github.com/taobaoaz/yaoyao-plugin/blob/main/MIGRATION.md)**

简述：
1. 备份 `yaoyao-plugin`
2. `git pull` 更新 plugin 到 v1.5.0+
3. `git clone` 安装本仓库（yaoyao-soul）
4. 更新 `openclaw.yaml` 配置
5. 重启 Gateway

## 数据兼容性

| 数据 | 位置 | 说明 |
|------|------|------|
| `memory/*.md` | plugin 目录 | soul 只读取，不修改 |
| `.implicit-tags.jsonl` | memory/ 目录 | soul 写入，记录隐式标注 |
| `persona.md` | memory/ 目录 | soul 追加 `### 观察笔记` |

## 最低要求

- OpenClaw >= 2026.5.5
- Node.js ^22.0.0
- yaoyao-plugin >= v1.5.0（建议同时安装）

## 需要帮助？

- [yaoyao-soul Issues](https://github.com/taobaoaz/yaoyao-soul/issues)
- [yaoyao-plugin Discussions](https://github.com/taobaoaz/yaoyao-plugin/discussions)
