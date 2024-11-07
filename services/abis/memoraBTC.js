const memoraBTCAddress =
  "0xcb770b466ebd8175f53859e576b3fe9ca9d9c316".toLowerCase();
const memoraBTCABI =[
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "_Judge",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "heir",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "btcAmount",
				"type": "uint256"
			}
		],
		"name": "BTCTransferCompleted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "bufferPeriod",
				"type": "uint256"
			}
		],
		"name": "BufferChanged",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "minter",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "heir",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "uri",
				"type": "string"
			}
		],
		"name": "EscrowCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "HeirSigned",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "JudgeDeclaredTriggered",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "TriggerDisabled",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "_buffer_period",
				"type": "uint256"
			}
		],
		"name": "changeBuffer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "heir",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "btcAmount",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "prompt",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "farcasterID",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "uri",
				"type": "string"
			}
		],
		"name": "createEscrow",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "declareTrigger",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "disableTrigger",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "escrowInfo",
		"outputs": [
			{
				"internalType": "address",
				"name": "judge",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "heir",
				"type": "address"
			},
			{
				"internalType": "address",
				"name": "minter",
				"type": "address"
			},
			{
				"internalType": "bool",
				"name": "isTriggerDeclared",
				"type": "bool"
			},
			{
				"internalType": "bool",
				"name": "isHeirSigned",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "btcAmount",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "prompt",
				"type": "string"
			},
			{
				"internalType": "enum MemoraBTC.AccountAction",
				"name": "action",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "triggerTimestamp",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "farcasterID",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "uri",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "heir",
				"type": "address"
			}
		],
		"name": "getAllEscrowsForHeir",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getAllMinters",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "escrowId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "minter",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "fid",
						"type": "uint256"
					}
				],
				"internalType": "struct MemoraBTC.MinterData[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "getEscrowURI",
		"outputs": [
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "getEscrowsCreatedByOwner",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "heir",
				"type": "address"
			}
		],
		"name": "getTriggeredEscrowsForHeir",
		"outputs": [
			{
				"internalType": "uint256[]",
				"name": "",
				"type": "uint256[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getUnclaimedEscrows",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "escrowId",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "minter",
						"type": "address"
					},
					{
						"internalType": "uint256",
						"name": "fid",
						"type": "uint256"
					}
				],
				"internalType": "struct MemoraBTC.MinterData[]",
				"name": "",
				"type": "tuple[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "escrowId",
				"type": "uint256"
			}
		],
		"name": "heirSign",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
];

module.exports = { memoraBTCAddress, memoraBTCABI };
