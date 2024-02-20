import { Regex } from '@companion-module/base'

export const configFields = [
    {
        type: 'textinput',
        id: 'targetIp',
        label: 'BroadLink RM4 Pro IP address',
        default: '',
        width: 12,
        regex: Regex.IP
    },
]