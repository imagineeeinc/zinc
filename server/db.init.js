import { Sequelize, Model, DataTypes } from '@sequelize/core'
import { AutoIncrement } from '@sequelize/core/decorators-legacy'
import { SqliteDialect, OPEN_READWRITE, OPEN_CREATE } from '@sequelize/sqlite3'

const FILE_NAME = process.env.SQLITE3_FILE || "./db/zinc.db"

export const sequelize = new Sequelize({
  dialect: SqliteDialect,
  storage: FILE_NAME,
	mode: OPEN_READWRITE | OPEN_CREATE
})
export class Users extends Model {}
Users.init(
	{
		user_id: {
			type: DataTypes.STRING,
			primaryKey: true,
			allowNull: false
		},
		socket_id: {
			type: DataTypes.STRING,
			allowNull: false
		}
	},
	{
		sequelize,
		modelName: 'ConnectedUsers'
	}
)
sequelize.sync({ force: false })