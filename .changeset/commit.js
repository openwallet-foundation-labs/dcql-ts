const { execSync } = require('node:child_process')

const getSignedOffBy = () => {
  const gitUserName = execSync('git config user.name').toString('utf-8').trim()
  const gitEmail = execSync('git config user.email').toString('utf-8').trim()

  return `Signed-off-by: ${gitUserName} <${gitEmail}>`
}

const getAddMessage = async (changeset) => {
  return `docs(changeset): ${changeset.summary}\n\n${getSignedOffBy()}\n`
}

const getVersionMessage = async () => {
  return `chore(release): new verion\n\n${getSignedOffBy()}\n`
}

module.exports = {
  getAddMessage,
  getVersionMessage,
}
