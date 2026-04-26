# Manhir Backend

Backend separado para publicar no Render. Ele recebe mensagens do frontend e repassa para o Hugging Face Space, onde roda o executor da IA junto com o modelo.

## Rodar localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e ajuste:

```env
PORT=3000
FRONTEND_ORIGIN=http://localhost:8888
HUGGINGFACE_SPACE_URL=http://127.0.0.1:8080
LLAMA_MODEL=manhir
```

## Rotas

`GET /health`

Verifica se o backend esta online.

`POST /chat`

Entrada:

```json
{
  "message": "Oi",
  "messages": [
    { "role": "user", "content": "Oi" }
  ]
}
```

Saida:

```json
{
  "reply": "Ola! Como posso ajudar?"
}
```

## Publicar no Render

Use estes campos:

```txt
Root Directory: backend
Build Command: npm install
Start Command: npm start
```

Variaveis de ambiente:

```env
FRONTEND_ORIGIN=https://seu-site.netlify.app
HUGGINGFACE_SPACE_URL=https://seu-usuario-seu-space.hf.space
LLAMA_MODEL=manhir
```

## Observacao

O Hugging Face Space deve expor uma API compativel com OpenAI em `/v1/chat/completions`. Se o Space usar `llama.cpp server`, ele pode iniciar assim:

```bash
./llama-server -m modelo.gguf --host 0.0.0.0 --port 8080
```
