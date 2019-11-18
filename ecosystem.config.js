module.exports = {
  apps : [{
    name: 'gloinebot',
    script: '/home/gloinebot/.yarn/bin/pm2',
    args: 'run start:prod',
  }]
};
