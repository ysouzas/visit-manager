import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { ParentConfig } from '../../types';

interface ConfigFormProps {
  config: ParentConfig;
  onSave: (newConfig: ParentConfig) => void;
}

export const ConfigForm: React.FC<ConfigFormProps> = ({ config, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<ParentConfig>(config);

  useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="card fade-in">
      <h2>⚙️ {t('nav.settings')}</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>{t('config.babyname')}</label>
          <input
            type="text"
            name="babyname"
            value={formData.babyname}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>{t('config.parentnames')}</label>
          <input
            type="text"
            name="parentnames"
            value={formData.parentnames}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>{t('config.hospitalname')}</label>
          <input
            type="text"
            name="hospitalname"
            value={formData.hospitalname}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>{t('config.roomnumber')}</label>
          <input
            type="text"
            name="roomnumber"
            value={formData.roomnumber}
            onChange={handleChange}
          />
        </div>
        <div className="input-group">
          <label>{t('config.mapslink')}</label>
          <input
            type="text"
            name="mapslink"
            value={formData.mapslink}
            onChange={handleChange}
          />
        </div>
        <button type="submit" className="w-full btn-primary">{t('common.save')}</button>
      </form>
    </div>
  );
};
