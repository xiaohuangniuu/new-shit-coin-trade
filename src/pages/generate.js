import {
  Textarea, Container,Button,
  chakra,  useToast,useMediaQuery
} from '@chakra-ui/react';
import Web3EthContract from "web3-eth-contract";
import Web3 from "web3";
import { useEffect, useState } from 'react';
import "../css/index.css"
// @ts-ignore
import { createIcon } from '@chakra-ui/icons'
import { Link } from 'react-router-dom';
import { HashLink as RouterLink } from 'react-router-hash-link';
import IndexPage from './Index';
const { MerkleTree } = require('merkletreejs')
const keccak256 = require("keccak256")



function GeneratePage(){
  const [ethAddressList,setETHAddressList] = useState("")
  const [rootHash,setRootHash] = useState("")
  const generateRoot = async () => {
    const list = ethAddressList.split("\n");
    let leaves = list.map(addr => keccak256(addr));
// 加到智能合约里面
    let merkleTree = new MerkleTree(leaves, keccak256, {sortPairs: true})
    let result = merkleTree.getRoot().toString('hex')
    setRootHash("0x"+result)
  }
  return (
    <chakra.div>
      <Textarea h={"200px"} onChange={(event) => {setETHAddressList(event.target.value)}}
                placeholder='输入ETH地址 不要有空格 如下所示&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;
      ' />
      <Button mt={3} onClick={generateRoot} colorScheme='blue'>Generate</Button>
      <chakra.div>
        白名单生成结果:{rootHash}
      </chakra.div>
    </chakra.div>
  )
}

export default GeneratePage;