import { CommanderStatic } from "commander";
import chalk from 'chalk'
import validator from '../../includes/validator'

const importCommand = async (program: CommanderStatic, options: any) => {
    let error = validator.importValidator(options)
    if (error && typeof error === 'string') {
        console.log(chalk.red(error))
        return
    }
    try {
        console.log("Hello")
    } catch (error) {
        console.log(error)
    }
}

export default importCommand
