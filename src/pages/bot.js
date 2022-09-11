import {
  NumberInput,NumberInputField,NumberInputStepper,NumberIncrementStepper,NumberDecrementStepper, Input, Button,
  chakra, useToast, useMediaQuery, Container,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import _ from "lodash"

function BotPage(){
  const [mnemonic,setMnemonic] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [addressList,setAddressList] = useState()
  const [bnbProvider,setBNBProvider] = useState(null)

  // 合约地址
  const [tokenAddress,setTokenAddress] = useState("0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3")
  const [maxBNB,setMaxBNB] = useState(0.002)
  const [minBNB,setMinBNB] = useState(0.001)


  const [buyMinSecond,setBuyMinSecond] = useState(1)
  const [buyMaxSecond,setBuyMaxSecond] = useState(2)

  const [rpcUrl,setRpcUrl] = useState("")

  // useEffect(()=>{
  //   if(bnbProvider){
  //     (async ()=>{
  //     const dd = await bnbProvider.getGasPrice()
  //       console.log(dd)
  //       const balanceInBNB = ethers.utils.formatEther(dd)
  //       console.log(balanceInBNB)
  //       console.log(Number(dd))
  //     })()
  //   }
  // },[bnbProvider])
  useEffect( ()=>{
    if (rpcUrl){
      const provider = ethers.getDefaultProvider(rpcUrl)
      setBNBProvider(provider)
    }
  },[rpcUrl])

  const [isRun,setIsRun] = useState(false)
  const [delay, setDelay] = useState(1000)
  const [nextBuyBNB,setNextBuyBNB] = useState(0)


  const [choiceAddressIndex,setChoiceAddressIndex] = useState(-1)
  const [logs,setLogs] = useState([])
  const [isPending,setIsPending] = useState(false)

  // const WBNBAddress = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"
  // const routerAddress = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"
  // const recipientAddress = "0x28Bf8F6e2Aa87B6361293BbE6b4C940fC1ce4dDa"

  const [WBNBAddress,setWBNBAddress] = useState("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")
  const [routerAddress,setRouterAddress] = useState("0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3")
  //const [recipientAddress,setRecipientAddress] = useState("0x28Bf8F6e2Aa87B6361293BbE6b4C940fC1ce4dDa")

  useEffect(() => {
    console.log("isRun",isRun,isPending)
    if (isRun && !isPending) {

      const timer = setInterval(async () => {
        console.log(addressList)
        if (addressList) {
          const buyBNB = _.floor(_.random(minBNB,maxBNB,true),4)
          setNextBuyBNB(buyBNB)

          let tempAddressList = []
          for (let i = 0;i< addressList.length;i++) {
            if (parseFloat(addressList[i].wbnb) > parseFloat(buyBNB) ){
              tempAddressList.push(addressList[i])
            }
          }

          if (tempAddressList.length == 0){
            logs.push("全部账户都没钱了")
            setLogs(logs);

          }else {
            console.log(tempAddressList)

            const index = _.random(0,tempAddressList.length-1)
            const addressIndex = tempAddressList[index].index
            setChoiceAddressIndex(addressIndex)


            const second = _.random(buyMinSecond,buyMaxSecond,true)
            setDelay(second*1000)


            logs.push("swap"+second+"秒即将开始,交易金额为"
              +buyBNB+"BNB,"+"用户地址为:"+addressList[index].address+"用户wbnb余额为:"+addressList[addressIndex].wbnb)
            setLogs(logs);
            setIsPending(true)
          }
        }
      }, delay)
      return () => clearInterval(timer)
    }
  }, [delay,isRun,isPending])

  useEffect( ()=>{
    (async ()=>{
      if (isPending){
        logs.push("swap即将开始")
        setLogs(logs);
        try{
          const res = await approveBNB(choiceAddressIndex)
          if (res) {
            const sr = await swap(choiceAddressIndex)
            if (sr) {
              setIsPending(false)
              logs.push("本次swap结束")
            }
          }
        }catch (e){
          alert(e)
          setIsPending(false)
          logs.push("本次swap结束")
        }

      }
    })()
  },[isPending])


  const getAccounts = ()=>{
    (async ()=>{
      const tmpAddressList = []
      setIsLoading(true)
      for (let i = 0;i<10;i++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic,"m/44'/60'/0'/0/"+i);
        console.log(wallet.privateKey)
        const address = await wallet.getAddress()

        const wbnb = new ethers.Contract(
          WBNBAddress,
          `[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]`,
          wallet.connect(bnbProvider)
          )

        let wbnbBalance = await wbnb.balanceOf(address)
        const result = await bnbProvider.getBalance(address)
        const balanceInBNB = ethers.utils.formatEther(result)
        tmpAddressList.push({wallet:wallet,address:address,balance:balanceInBNB,index:i,wbnb:ethers.utils.formatEther(wbnbBalance)})
      }
      setIsLoading(false)
      setAddressList(tmpAddressList)
    })()
  }


  const toast = useToast()
  const updateIsRun = ()=> {
    if (!isRun) {
      if (maxBNB <= 0 || minBNB <= 0 || buyMaxSecond <= 0 || buyMinSecond <= 0 ){
        toast({
          title: '参数错误',
          description: "请检查参数",
          status: 'error',
          duration: 3000,
          position: 'top',
          isClosable: true,
        })
        return;
      }
    }
    setIsRun(!isRun)
    setIsPending(false)
  }


  const approveBNB = async (addressIndex) => {

      const wallet0 = addressList[addressIndex]
      console.log(addressList,wallet0,addressIndex)
      const account = wallet0.wallet.connect(bnbProvider)
      const wbnb = new ethers.Contract(
        WBNBAddress,
    `[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]`,
        account,
      )

      let checkAllowance = await wbnb.allowance(wallet0.address,
        routerAddress)
      // 如果授权大于0
      if (checkAllowance.lte(0)) {
        // approve
        const tx = await wbnb.approve(
          routerAddress, //pancake的router地址
          ethers.constants.MaxUint256 // 授权数量
        )
        const receipt = await tx.wait()
        console.log('Transaction receipt',receipt)
      }

    const result = await bnbProvider.getBalance(wallet0.address)
    const balanceInBNB = ethers.utils.formatEther(result)

    let wbnbBalance = await wbnb.balanceOf(wallet0.address)
    addressList[choiceAddressIndex] = {wallet:wallet0.wallet,address:wallet0.address,balance:balanceInBNB,index:wallet0.index,wbnb:ethers.utils.formatEther(wbnbBalance)}
    setAddressList(addressList)
    return true
  }

  const swap = async (addressIndex) => {

      const wallet0 = addressList[addressIndex]
      const account = wallet0.wallet.connect(bnbProvider)
      const router = new ethers.Contract(
        routerAddress,
        [
          'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
          'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
        ],
        account
      )

      const amountIn = ethers.utils.parseUnits(String(nextBuyBNB), 'ether');
      console.log(String(nextBuyBNB))
      // 0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3 替换自己的合约地址
      // 获取到当前0.01 wbnb能换多少币
      const amounts = await router.getAmountsOut(amountIn,
        [WBNBAddress, tokenAddress])
      console.log(amounts)

      const amountOutMin = amounts[1].sub(amounts[1].div(10))
      // 开始交换
      const tx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        [WBNBAddress, tokenAddress],
        wallet0.address,
        Date.now() + 1000 * 60 * 10, // 10 minutes
        {
          gasPrice: Number(await bnbProvider.getGasPrice()),
          gasLimit: 1000000
        }
      )
      const receipt = await tx.wait()
      console.log('Swap receipt',receipt)

      const result = await bnbProvider.getBalance(wallet0.address)
      const balanceInBNB = ethers.utils.formatEther(result)
      const wbnb = new ethers.Contract(
        WBNBAddress,
        `[{"constant":true,"inputs":[],"name":"name","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"guy","type":"address"},{"name":"wad","type":"uint256"}],"name":"approve","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"src","type":"address"},{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"dst","type":"address"},{"name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"deposit","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"},{"name":"","type":"address"}],"name":"allowance","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"guy","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"dst","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Deposit","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"src","type":"address"},{"indexed":false,"name":"wad","type":"uint256"}],"name":"Withdrawal","type":"event"}]`,
        wallet0.wallet.connect(bnbProvider)
      )

      let wbnbBalance = await wbnb.balanceOf(wallet0.address)

      addressList[choiceAddressIndex] = {wallet:wallet0.wallet,address:wallet0.address,balance:balanceInBNB,index:wallet0.index,wbnb:ethers.utils.formatEther(wbnbBalance)}
      setAddressList(addressList)
      return true
  }

  return (
    <Container>
      <chakra.div pointerEvents={isRun?'none':""} boxShadow={isRun?"rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;":""} borderRadius={"0.325rem"} p={2} mt={5}>
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
               onChange={(event)=>{setWBNBAddress(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入WBNB地址 不填默认测试网地址'
               size='sm'
        />

        {/*<Input mt={2} mb={2}*/}
        {/*       onChange={(event)=>{setRecipientAddress(event.target.value)}}*/}
        {/*       focusBorderColor='pink.400'*/}
        {/*       placeholder='请输入swap recipient 不填默认测试网地址'*/}
        {/*       size='sm'*/}
        {/*/>*/}


        <Input mt={2} mb={2}
               onChange={(event)=>{setRouterAddress(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入swap recipe地址 不填默认测试网地址'
               size='sm'
        />

        <Input
          onChange={(event)=>{setMnemonic(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='请输入助记词'
          size='sm'
        />

        <Button mt={2} disabled={isLoading} isLoading={isLoading} colorScheme={'blue'} onClick={getAccounts}>扫描子账号</Button>
        <chakra.div mt={2} borderRadius={"0.325rem"} maxH={"300px"} overflow={'auto'} bg={'purple.200'} p={2}>
          子账号:<br/>
          {addressList? addressList.map((v,k)=>{
            return <chakra.div>
              账户地址:{v.address} BNB余额:{v.balance} WBNB:{v.wbnb}
            </chakra.div>
          }):""}
        </chakra.div>

        <Input mt={2} mb={2} onChange={(event)=>{setTokenAddress(event.target.value)}}
               focusBorderColor='pink.400'
          placeholder='请输入合约地址'
          size='sm'
        />
        <chakra.span>请输入买入BNB最小值</chakra.span>
        <NumberInput  onChange={(value) => {setMinBNB(parseFloat(value))}}
                       defaultValue={0.001} precision={3} min={0.001} max={20}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <chakra.span>请输入买入BNB最大值</chakra.span>
        <NumberInput  onChange={(value) => {setMaxBNB(parseFloat(value))}}
                       defaultValue={0.002} precision={3} min={0.002} max={20}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>


        <chakra.span>请输入购买的最快频率(单位秒)</chakra.span>
        <NumberInput   onChange={(value) => {setBuyMinSecond(parseInt(value))}}
                       defaultValue={1} precision={0} min={1} max={20}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <chakra.span>请输入购买的最慢频率(单位秒)</chakra.span>
        <NumberInput   onChange={(value) => {setBuyMaxSecond(parseInt(value))}}
                       defaultValue={2} precision={0} min={2} max={20}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>


      </chakra.div>
      <Button disabled={isRun} mt={2} colorScheme={'blue'} onClick={()=>{updateIsRun()}}>确定配置</Button>
      {isRun?  <Button mt={2} colorScheme={'blue'} onClick={()=>{updateIsRun()}}>停止运行</Button>:""}
      <chakra.div mt={2} borderRadius={"0.325rem"} overflow={'auto'} bg={'purple.200'} p={2}>
        日志:<br/>
        {logs? logs.map((v,k)=>{
          return <chakra.div>
            {v}
          </chakra.div>
        }):""}
      </chakra.div>
    </Container>

  )
}

export default BotPage;