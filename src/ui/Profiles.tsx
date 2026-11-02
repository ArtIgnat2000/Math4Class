import { useState } from 'react';
import { Check, Plus, ShieldCheck } from 'lucide-react';
import { useApp } from '../state/AppContext';
import type { Grade } from '../engine/content';
import type { Profile } from '../engine/model';
import { Avatar, GradeSwitcher, Modal } from './shared';
export function ProfilesDialog({ onClose }: { onClose: () => void }) {
  const { data, profile, update, updateProfile, addProfile } = useApp();
  const [create, setCreate] = useState(false);
  const [name, setName] = useState(profile.name);
  const [grade, setGrade] = useState<Grade>(profile.grade);
  const [avatar, setAvatar] = useState<Profile['avatar']>(profile.avatar);
  return (
    <Modal
      title={create ? 'Новое маленькое начало' : 'У каждого — свой путь'}
      eyebrow="ПРОФИЛИ ИССЛЕДОВАТЕЛЕЙ"
      onClose={onClose}
      className="profiles-dialog"
    >
      <p className="modal-intro">
        Занимайтесь на одном устройстве. У каждого ребёнка сохраняются свои темы и достижения.
      </p>
      {!create && (
        <div className="profiles-list">
          {data.profiles.map((p) => (
            <button
              key={p.id}
              className={p.id === profile.id ? 'active' : ''}
              onClick={() => {
                if (p.id !== profile.id) {
                  update((d) => ({ ...d, activeProfileId: p.id }));
                  onClose();
                }
              }}
            >
              <Avatar color={p.avatar} />
              <span>
                <strong>{p.name}</strong>
                <small>{p.grade} класс</small>
              </span>
              {p.id === profile.id && <Check size={18} />}
            </button>
          ))}
          {data.profiles.length < 12 && (
            <button
              className="add-profile"
              onClick={() => {
                setCreate(true);
                setName('');
              }}
            >
              <span className="add-profile-icon">
                <Plus size={20} />
              </span>
              Добавить ученика
            </button>
          )}
        </div>
      )}
      <form
        className="profile-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          if (create) addProfile(name, grade, avatar);
          else updateProfile((p) => ({ ...p, name: name.trim(), grade, avatar }));
          onClose();
        }}
      >
        <label className="field-label" htmlFor="profile-name">
          {create ? 'Как тебя зовут?' : 'Имя в твоём профиле'}
        </label>
        <input
          data-autofocus
          id="profile-name"
          className="text-input"
          maxLength={24}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Саша"
          autoComplete="off"
          required
        />
        <div className="profile-form-options">
          <div>
            <span className="field-label">Твой цвет</span>
            <div className="avatar-picker" role="group" aria-label="Цвет профиля">
              {(['sage', 'peach', 'lavender', 'blue'] as const).map((color, i) => (
                <button
                  type="button"
                  key={color}
                  aria-label={['Зелёный', 'Персиковый', 'Лавандовый', 'Голубой'][i]}
                  aria-pressed={avatar === color}
                  className={avatar === color ? 'selected' : ''}
                  onClick={() => setAvatar(color)}
                >
                  <Avatar color={color} size={38} />
                </button>
              ))}
            </div>
          </div>
          <GradeSwitcher grade={grade} onChange={setGrade} compact />
        </div>
        <button type="submit" className="button primary full-width" disabled={!name.trim()}>
          {create ? 'Начать свой путь' : 'Сохранить профиль'}
          <Check size={17} />
        </button>
        {create && (
          <button
            type="button"
            className="text-button full-width back-to-profiles"
            onClick={() => {
              setCreate(false);
              setName(profile.name);
              setGrade(profile.grade);
              setAvatar(profile.avatar);
            }}
          >
            К списку учеников
          </button>
        )}
      </form>
      <p className="privacy-note">
        <ShieldCheck size={16} />
        Никакой регистрации. Всё хранится на устройстве.
      </p>
    </Modal>
  );
}
