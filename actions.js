export function setupActions(instance) {
    instance.setActionDefinitions({
        sendRF: {
            name: "Learn & Send RF code",
            description: "Send out RF commands and record them using the learn function.",
            learnTimeout: 30000,
            options: [
                {
                    type: 'textinput',
                    label: 'Code (Hex)',
                    id: 'code',
                }
            ],
            callback: async (action, context) => {
                instance.sendCode(action.options.code);
            },
            learn: async (action) => {
                var newCode = await instance.learnRFCode();
                return {
                    code: newCode
                }
            }
        },
        sendIR: {
            name: "Learn & Send IR code",
            description: "Send out IR commands and record them using the learn function.",
            learnTimeout: 10000,
            options: [
                {
                    type: 'textinput',
                    label: 'Code (Hex)',
                    id: 'code',
                }
            ],
            callback: async (action, context) => {
                instance.sendCode(action.options.code);
            },
            learn: async (action) => {
                var newCode = await instance.learnIRCode();
                return {
                    code: newCode
                }
            }
        },
    })
}