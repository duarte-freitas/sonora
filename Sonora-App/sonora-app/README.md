# Sonora — app musical web

Projeto React + Vite inspirado em um player de música, revisado e adaptado para funcionar em computador e celular. Ele pode ser instalado como um aplicativo web (PWA) em navegadores compatíveis.

## Como executar no Windows

1. Instale o **Node.js LTS**: https://nodejs.org/
2. Extraia o arquivo ZIP em uma pasta.
3. Abra essa pasta no Explorador de Arquivos, clique na barra de endereço, digite `cmd` e aperte Enter.
4. No terminal, execute:

   ```bash
   npm install
   npm run dev
   ```

5. Abra o endereço que o terminal mostrar — normalmente `http://localhost:5173`.
6. Para encerrar, volte ao terminal e aperte `Ctrl + C`.

## Criar e instalar como aplicativo

Para gerar a versão de produção e instalar o Sonora como app no Chrome ou Edge, execute:

```bash
npm run build
npm run preview
```

Abra o endereço que o terminal mostrar (normalmente `http://localhost:4173`). No menu do navegador, escolha **Instalar Sonora** ou **Instalar página como app**, se essa opção estiver disponível. A instalação PWA é habilitada na versão de produção; no modo `npm run dev`, o app roda como site de desenvolvimento.

## Recursos incluídos

- Player com play/pause, próxima/anterior, barra de progresso, volume e mudo.
- Reprodução aleatória e modos de repetição.
- Busca de faixas no catálogo do iTunes com debounce e cancelamento de requisições antigas.
- Modo demonstração com faixas de exemplo se o catálogo não responder.
- Favoritos, playlists criadas pelo usuário e armazenamento no navegador.
- Fila de reprodução e atalhos de teclado: `Espaço` para play/pause, setas para trocar de faixa, `Shift + setas` para avançar/voltar 10 segundos e `M` para silenciar.
- Layout adaptável para telas menores e manifesto PWA.

## Sobre as músicas

O catálogo do iTunes fornece **pré-escutas**, geralmente de cerca de 30 segundos, não faixas completas. A disponibilidade depende da faixa e da região. As faixas de demonstração dependem de serviços externos, então podem não tocar se os links mudarem ou se houver bloqueio de rede. Este projeto não usa login nem se conecta à conta do Spotify.

## Privacidade

Favoritos, volume e playlists são guardados no `localStorage` deste navegador. A busca de músicas envia o termo consultado à API pública de busca do iTunes. Não há servidor próprio nem autenticação.
