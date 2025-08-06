import { View, TextInput, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/state/index'

const ConfigModal = () => {
  const { appHost, appPort, setAppHost, setAppPort } = useAppStore();
  const [protocol, setProtocol] = useState('http')
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (appHost) {
      const url = new URL(appHost.startsWith('http') ? appHost : `http://${appHost}`)
      setProtocol(url.protocol.replace(':', ''))
      setIp(url.hostname)
    }
    if (appPort) setPort(appPort)
  }, [appHost, appPort])

  const fullUrl = `${protocol}://${ip}${port ? `:${port}` : ''}`

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setAppHost(`${protocol}://${ip}`)
    setAppPort(port)

    console.log('Configuración guardada:', fullUrl)
    setIsSaving(false)
  }

  return (
    <View className="p-4 space-y-5 bg-white rounded-2xl flex-1 gap-2">
      {/* Selector + IP */}
      <View className="flex-row gap-3 items-center">
        <View className="w-[130px] h-[50px] justify-center border border-gray-300 rounded-xl overflow-hidden bg-white">
          <Picker
            selectedValue={protocol}
            onValueChange={(value) => setProtocol(value)}
            mode="dropdown"
            dropdownIconColor="#4B5563"
          >
            <Picker.Item label="http" value="http" />
            <Picker.Item label="https" value="https" />
          </Picker>
        </View>

        <TextInput
          value={ip}
          onChangeText={setIp}
          placeholder="Ej: 192.168.0.1"
          keyboardAppearance="light"
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
        />
      </View>

      {/* Puerto */}
      <TextInput
        value={port}
        onChangeText={setPort}
        placeholder="Puerto (ej: 3000)"
        keyboardAppearance="light"
        keyboardType="numeric"
        className="border border-gray-300 rounded-xl px-4 py-2 text-base h-[50px] bg-white"
      />

      {/* Vista previa */}
      <View className="border border-dashed border-gray-300 rounded-xl px-4 py-2 bg-gray-50">
        <Text className="text-gray-600 text-sm">{fullUrl || 'Vista previa'}</Text>
      </View>

      {/* Botón de Guardar */}
      <TouchableOpacity
        onPress={handleSave}
        disabled={isSaving}
        className={`mt-4 rounded-2xl py-3 items-center justify-center h-[50px] ${
          isSaving ? 'bg-blue-400' : 'bg-blue-600'
        }`}
      >
        {isSaving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white font-semibold text-base">Guardar configuración</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

export default ConfigModal
