export const erc20Abi = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;

export const nousOracleAbi = [
  {
    type: "function",
    name: "createRequest",
    stateMutability: "payable",
    inputs: [
      { name: "query", type: "string" },
      { name: "numInfoAgents", type: "uint256" },
      { name: "rewardAmount", type: "uint256" },
      { name: "bondAmount", type: "uint256" },
      { name: "deadline", type: "uint256" },
      { name: "rewardToken", type: "address" },
      { name: "bondToken", type: "address" },
      { name: "specifications", type: "string" },
      {
        name: "requiredCapabilities",
        type: "tuple",
        components: [
          { name: "capabilities", type: "string[]" },
          { name: "domains", type: "string[]" },
        ],
      },
    ],
    outputs: [{ name: "requestId", type: "uint256" }],
  },
  {
    type: "function",
    name: "nextRequestId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "phases",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "getCommits",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "agents", type: "address[]" },
      { name: "commitments", type: "bytes32[]" },
    ],
  },
  {
    type: "function",
    name: "getReveals",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "agents", type: "address[]" },
      { name: "answers", type: "bytes[]" },
    ],
  },
  {
    type: "function",
    name: "getResolution",
    stateMutability: "view",
    inputs: [{ name: "requestId", type: "uint256" }],
    outputs: [
      { name: "finalAnswer", type: "bytes" },
      { name: "finalized", type: "bool" },
    ],
  },
] as const;
