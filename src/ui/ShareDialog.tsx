import { useState } from 'react';
import { Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { appShareUrl } from '../engine/share';
import { InfoNote, Modal } from './shared';

const SHARE_TITLE = 'Число — математика для детей';
const SHARE_TEXT = 'Учимся математике с интересом!';

/**
 * QR-код и ссылка на приложение — второй способ поделиться, рядом с обычной кнопкой
 * «Поделиться приложением». Работает офлайн: код рисуется локально, без запросов в сеть.
 */
export function ShareDialog({ onClose }: { onClose: () => void }) {
  const url = appShareUrl();
  const [status, setStatus] = useState('');
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard-unavailable');
      await navigator.clipboard.writeText(url);
      setStatus('Ссылка скопирована. Вставьте её в сообщение или письмо другу.');
    } catch {
      setStatus('Скопировать автоматически не получилось. Выделите ссылку и скопируйте вручную.');
    }
  };
  const share = async () => {
    try {
      await navigator.share({ title: SHARE_TITLE, text: SHARE_TEXT, url });
      setStatus('Спасибо, что делитесь приложением!');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setStatus('Не удалось открыть «Поделиться». Скопируйте ссылку кнопкой выше.');
    }
  };
  return (
    <Modal
      title="Покажите QR-код"
      eyebrow="ССЫЛКА НА ПРИЛОЖЕНИЕ"
      onClose={onClose}
      className="share-dialog"
    >
      <div className="share-qr" data-autofocus tabIndex={-1}>
        <QRCodeSVG
          value={url}
          size={232}
          level="M"
          marginSize={4}
          bgColor="#ffffff"
          fgColor="#24382b"
          title={`QR-код со ссылкой на приложение: ${url}`}
          className="share-qr-code"
        />
      </div>
      <p className="modal-intro">
        Друг открывает камеру на телефоне и наводит её на код — «Число» открывается само. Ссылку
        можно и просто переписать или отправить в мессенджере.
      </p>
      <label className="share-link-label" htmlFor="share-app-link">
        Ссылка на приложение
      </label>
      <input
        id="share-app-link"
        className="share-link"
        value={url}
        readOnly
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        onClick={(event) => event.currentTarget.select()}
      />
      <div className="share-actions">
        <button className="button primary" onClick={() => void copy()}>
          <Copy size={17} />
          Скопировать ссылку
        </button>
        {canShare && (
          <button className="button secondary" onClick={() => void share()}>
            <Share2 size={17} />
            Поделиться…
          </button>
        )}
      </div>
      {status && (
        <p className="share-status" role="status">
          {status}
        </p>
      )}
      <div className="install-instructions share-install">
        <p>
          <strong>iPhone и iPad</strong>В Safari нажмите «Поделиться» → «На экран Домой».
        </p>
        <p>
          <strong>Android и компьютер</strong>В Chrome откройте меню → «Установить приложение».
        </p>
      </div>
      <InfoNote>
        QR-код ведёт на опубликованную версию. После первой загрузки приложение работает без
        интернета.
      </InfoNote>
      <button className="button secondary full-width" onClick={onClose}>
        Закрыть
      </button>
    </Modal>
  );
}
