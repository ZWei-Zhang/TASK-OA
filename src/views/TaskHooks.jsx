import { Button, Modal, Popconfirm, Table, Tag, Form, Input, DatePicker, message } from 'antd'
// import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import './Task.less'
import { getTaskList, addTask, removeTask, completeTask } from '@/api'

// 对日期处理的方法
const zero = function zero(text) {
  text = String(text)
  return text.length < 2 ? '0' + text : text
}
const formatTime = function formatTime(time) {
  let arr = time.match(/\d+/g),
    [, month, day, hours = '00', minutes = '00'] = arr
  return `${zero(month)}-${zero(day)} ${zero(hours)}:${zero(minutes)}`
}

export default function Task() {
  // static propTypes = {second: third}
  // 表格列的数据
  const columns = [{
    title: '编号',
    dataIndex: 'id',
    width: '8%',
  }, {
    title: '任务描述',
    dataIndex: 'task',
    ellipsis: true
  }, {
    title: '状态',
    dataIndex: 'status',
    align: 'center',
    width: '10%',
    render: (text, record) => +text === 1 ? '未完成' : '已完成'
  }, {
    title: '完成时间',
    align: 'center',
    dataIndex: 'time',
    render: (_, record) => {
      let { state, time, complete } = record
      if (+state === 2) time = complete
      return formatTime(time)
    }
  }, {
    title: '操作',
    width: '15%',
    render: (_, record) => {
      let { state, id } = record
      return <>
        <Popconfirm title='您确定要删除吗？' onConfirm={removeHandle.bind(null, id)}>
          <Button type='link'>删除</Button>
        </Popconfirm>
        {
          +state !== 2 &&
          <Popconfirm title='您确定要把此任务设置为完成吗？' onConfirm={updateHandle.bind(null, id)}>
            <Button type='link'>完成</Button>
          </Popconfirm>
        }
      </>
    }
  },]
  // 初始组件的状态
  let [selectedIndex, setSelectedIndex] = useState(0),
    [tableData, setTableData] = useState([]),
    [tableLoading, setTableLoading] = useState(false),
    [modalVisible, setModalVisible] = useState(false),
    [confirmLoading, setConfirmLoading] = useState(false)
  let [formIns] = Form.useForm()

  // 关于TABLE和数据的处理
  const query = async () => {
    setTableLoading(true)
    try {
      let { code, list } = await getTaskList(selectedIndex)
      if (+code !== 0) list = []
      setTableData(list)
    } catch (_) {
    }
    setTableLoading(false)
  }
  useEffect(() => {
    query();
  }, [selectedIndex]);//eslint-disable-line

  // 对话框和表单处理
  // 关闭对话框 & 清除表单中的内容
  const closeModal = () => {
    setModalVisible(false)
    setConfirmLoading(false)
    formIns.resetFields()
  }
  const submit = async () => {
    try {
      await formIns.validateFields()
      let { task, time } = formIns.getFieldsValue()
      time = time.format('YYYY-MM-DD HH:mm:ss')
      // 表单校验通过，向服务器发送请求
      setConfirmLoading(true)
      let { code } = await addTask(task, time)
      if (+code === 0) {
        closeModal()
        query()
        message.success('恭喜您，操作成功了！')
      } else {
        message.error('很遗憾，操作失败，请稍后再试！')
      }
    } catch (_) { }
    setConfirmLoading(false)
  }
  // 关于删除和完成的操作
  const removeHandle = async (id) => {
    try {
      let { code } = await removeTask(id)
      if (+code === 0) {
        query()
        message.success('恭喜您，操作成功了！')
      } else {
        message.error('很遗憾，操作失败，请稍后再试！')
      }
    } catch (_) { }
  }
  const updateHandle = async (id) => {
    try {
      let { code } = await completeTask(id)
      if (+code === 0) {
        query()
        message.success('恭喜您，操作成功了！')
      } else {
        message.error('很遗憾，操作失败，请稍后再试！')
      }
    } catch (_) { }
  }
  return <div className="task-box">
    {/* 头部 */}
    <div className="header">
      <h2 className="title">TASK OA 任务管理系统</h2>
      <Button type='primary'
        onClick={() => {
          setModalVisible(true)
        }}
      >新增任务</Button>
    </div>

    {/* 标签 */}
    <div className="tag-box">
      {['全部', '未完成', '已完成'].map((item, index) => {
        return <Tag
          key={index}
          color={selectedIndex === index ? '#1677ff' : ''}
          onClick={() => { setSelectedIndex(index) }}
        >{item}</Tag>
      })}
      {/* <Tag color='#1677ff'>全部</Tag>
      <Tag>未完成</Tag>
      <Tag>已完成</Tag> */}
    </div>

    {/* 表格 */}
    <Table dataSource={tableData} columns={columns} loading={tableLoading} pagination={false} rowKey='id' />

    {/* 对话框 & 表单 */}
    <Modal
      title='新增任务窗口'
      open={modalVisible}
      confirmLoading={confirmLoading}
      keyboard={false}
      maskClosable={false}
      okText='确认提交'
      onCancel={closeModal} onOk={submit}>
      <Form form={formIns} layout='vertical' validateTrigger='onBlur' initialValues={{ task: '', time: '' }}>
        <Form.Item
          label='任务描述'
          name='task'
          rules={[
            { required: true, message: '任务描述是必须的' },
            { min: 6, message: '输入的内容至少6位以上' }
          ]}>
          <Input.TextArea rows={4}></Input.TextArea>
        </Form.Item>
        <Form.Item
          label='预期完成时间'
          name='time'
          rules={[
            { required: true, message: '预期完成时间是必填项' }
          ]}>
          <DatePicker showTime></DatePicker>
        </Form.Item>
      </Form>
    </Modal>
  </div>
}