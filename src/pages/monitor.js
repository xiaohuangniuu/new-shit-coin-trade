
import {
  Textarea,
  NumberInput,NumberInputField,NumberInputStepper,NumberIncrementStepper,NumberDecrementStepper, Input, Button,
  chakra, useToast, useMediaQuery, Container,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { ethers } from "ethers";
import _ from "lodash"
import axios from 'axios';

function Monitor(){
  const [pairAddress,setPairAddress] = useState("")
  const [addressList,setAddressList] = useState("")
  const [cookie,setCookie] = useState("80f328156447d396a76bd7cb48d2c9e21670436928654938415")
  const [isRun,setIsRun] = useState(false)
  const [symbol,setSymbol] = useState(false)
  const [logs,setLogs] = useState([])
  useEffect(() => {
    if (isRun == false){
      return;
    }
    if (pairAddress == "") {
      alert("先设置pairAddress")
      return
    }
    if (isRun ) {

      const timer = setInterval(async () => {
        let newLogs = []
        const list = addressList.split("\n");
        console.log(list.length)
        const res = await axios.get('https://api.aaave.cloud/v1api/v3/pairs/'+pairAddress+'-bsc/txs?address=', {
          headers: {
            'x-auth': cookie,
          }
        });

        if ("data" in res){
          let data = res["data"]["data"]
          for (var i = 0;i<data.length;i++){
            if (data[i]["to_symbol"] == symbol) {
              let flag = true
              for (let j = 0;j< list.length;j++) {
                console.log("A",String(data[i]["wallet_address"]).toLowerCase())
                console.log("B",String(list[j]).toLowerCase())
                if (String(data[i]["wallet_address"]).toLowerCase() == String(list[j]).toLowerCase()) {
                  flag = false
                }
              }

              if (flag) {
                newLogs.push(
                  "交易hash"+data[i]["transaction"]+"买入币种为:"+data[i]["from_symbol"]+"价值为$"+data[i]["amount_usd"])

              }
            }
          }
        }
        setLogs(newLogs);
        console.log(res)

      }, 3000)

      return () => clearInterval(timer)
    }
  }, [isRun])

  const toast = useToast()
  const updateIsRun = ()=> {
    setIsRun(!isRun)
  }
  return (
    <chakra.div>
    <Container>
      <Input mt={10}
        onChange={(event)=>{setPairAddress((event.target.value))}}
        focusBorderColor='pink.400'
        placeholder='输入pairAddress地址'
        size='sm'
      />
      <Input
        onChange={(event)=>{setCookie((event.target.value))}}
        focusBorderColor='pink.400'
        placeholder='输入cookie'
        size='sm'
      />

      <Input
        onChange={(event)=>{setSymbol((event.target.value))}}
        focusBorderColor='pink.400'
        placeholder='请输入代币符号'
        size='sm'
      />
      <Textarea h={"300px"}    placeholder='排除的地址,输入ETH地址 不要有空格 一个地址一行如下所示&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231&#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;0x6c674c1ef8bc3889f9fdada9e0f71df70b47d231 &#13;
      ' onChange={(event)=>{
        setAddressList(event.target.value)
      }}>

      </Textarea>
      <Button disabled={isRun} mt={2} colorScheme={'blue'} onClick={()=>{updateIsRun()}}>确定监控配置</Button>
      {isRun?  <Button mt={2} colorScheme={'blue'} onClick={()=>{updateIsRun()}}>停止运行购买</Button>:""}
    </Container>
  <chakra.div mt={2} borderRadius={"0.325rem"} overflow={'auto'} bg={'purple.200'} p={2}>
    日志:<br/>
    {logs? logs.map((v,k)=>{
      return <chakra.div>
        {v}
      </chakra.div>
    }):""}
  </chakra.div>
</chakra.div>
  )
}

export default Monitor;