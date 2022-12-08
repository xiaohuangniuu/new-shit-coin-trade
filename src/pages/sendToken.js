import {
  Input,
  Button,
  chakra,
  Container,
  Textarea,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { BigNumber, ethers } from 'ethers';
import _ from "lodash"
import ReverseBotPage from './reverse_bot';

function SendToken(){
  const [isLoading,setIsLoading] = useState(false)
  const [addressList,setAddressList] = useState()
  const [bnbProvider,setBNBProvider] = useState(null)
  const [privateKey,setPrivateKey] = useState("")

  // 合约地址
  const [tokenAddress,setTokenAddress] = useState("0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3")
  const [rpcUrl,setRpcUrl] = useState("")
  useEffect( ()=>{
    if (rpcUrl){
      const provider = ethers.getDefaultProvider(rpcUrl)
      setBNBProvider(provider)
    }
  },[rpcUrl])

  const [tokenNumber,setTokenNumber] = useState("")

  const [maxToken,setMaxToken] = useState(0)
  const [minToken,setMinToken] = useState(0)

  const airdrop =() => {
    (async ()=>{
      console.log("start")
      if (maxToken <= 0 || minToken <= 0) {
        if (parseFloat(tokenNumber) <= 0) {
          alert("转账bnb金额错误")
          return;
        }
      }


      let transferNumber = tokenNumber


      setIsLoading(true)
      let wallet = new ethers.Wallet(privateKey,bnbProvider)
      const account = wallet.connect(bnbProvider)
      const token = new ethers.Contract(
        tokenAddress,
        `[{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":true,"internalType":"address","name":"spender","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"from","type":"address"},{"indexed":true,"internalType":"address","name":"to","type":"address"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"address","name":"recipient","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"}]`,
        account,
      )
      const decimal = await token.decimals()
      console.log(parseInt(decimal))
      const tx = await token.balanceOf(
        wallet.getAddress(), //pancake的router地址
      )
      if (parseInt(tx.toString()) <= 0) {
        alert("余额不足")
        return
      }
      console.log(tx.toString())
      // const receipt = await tx.wait()
      // console.log(receipt)

      // const result = await bnbProvider.getBalance(wallet.getAddress())
      // const balanceInBNB = ethers.utils.formatEther(result)
      // console.log("余额",balanceInBNB,bnbNumber)
      // const gasPrice = await bnbProvider.getGasPrice()
      // ethers.utils.formatUnits(gasPrice, "ether")
      if (addressList == "") {
        alert("转账地址为空")
        return
      }

      const list = addressList.split("\n");
      for (let i = 0;i<list.length;i++){
        if (ethers.utils.isAddress(list[i])) {
          if (maxToken > 0 && minToken >0) {
            console.log("随机数据")
            transferNumber = _.floor(_.random(minToken,maxToken,false),0)
            console.log("随机number",transferNumber)
          }

          console.log(decimal)
          //console.log(tokenNumber,transferNumber * 10 ** decimal)
          const transferResult = await token.transfer(
            list[i],
            ethers.utils.parseUnits(String(transferNumber), decimal),
            {
              gasPrice: Number(await bnbProvider.getGasPrice()),
              gasLimit: 21000,
            }
          )

          const dd = await transferResult.wait()
          console.log(dd)
          if (dd["status"] ==1){
            console.log("转账成功")
          }else {
            console.log("转账失败")
            break;
          }

        }
      }
      setIsLoading(false)
    })()
  }


  return (
    <Container>
      <chakra.div borderRadius={"0.325rem"} p={2} mt={5}>
        <chakra.div>
          线上节点: https://bsc-dataseed1.binance.org

          <br/>
          测试节点: https://data-seed-prebsc-2-s2.binance.org:8545<br/>
          测试 WBNBAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" <br/>
          测试 routerAddress = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3" <br/>
          合约: https://testnet.bscscan.com/token/0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3
        </chakra.div>
        <Input mt={2} mb={2}
               onChange={(event)=>{setRpcUrl(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入RPC节点'
               size='sm'
        />

        <Input mt={2} mb={2}
               onChange={(event)=>{setTokenAddress(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入合约地址'
               size='sm'
        />

        <Input
          onChange={(event)=>{setPrivateKey(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='请输入私钥 不是助记词'
          size='sm'
        />

        <Input
          onChange={(event)=>{setTokenNumber((event.target.value))}}
          focusBorderColor='pink.400'
          placeholder='token转账数量 例如:0.1(支持小数)'
          size='sm'
        />

        <Textarea h={"300px"}    placeholder='输入ETH地址 不要有空格 一个地址一行如下所示&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;
      ' onChange={(event)=>{
          setAddressList(event.target.value)
        }}>

        </Textarea>

        <chakra.span color={"red"}>同时输入最大值和最小值,token数量在此区间随机发放<br/></chakra.span>
        <chakra.span>请输入转账Token最小值</chakra.span>
        <NumberInput  onChange={(value) => {setMinToken(parseFloat(value))}}
                      defaultValue={0} precision={0} min={0} max={20000000000000000000000}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <chakra.span>请输入转账Token最大值</chakra.span>
        <NumberInput  onChange={(value) => {setMaxToken(parseFloat(value))}}
                      defaultValue={0} precision={0} min={0} max={20000000000000000000000}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <Button mt={2}  isLoading={isLoading} colorScheme={'blue'} onClick={airdrop}>开始转账</Button>
      </chakra.div>
    </Container>

  )
}
export default SendToken;