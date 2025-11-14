'use client';

import { AiOutlineCheck } from 'react-icons/ai';
import { memo } from 'react';
import { IconType } from 'react-icons';
import {
  popularFacilities,
  leftSections,
  rightSections,
  FacilitySection,
  FacilityItem,
} from './facilitiesData';

type FacilitiesDrawerProps = {
  open: boolean;
  onClose: () => void;
};

const Chip = memo(({ text }: { text: string }) => (
  <span className="ml-2 bg-gray-100 text-gray-600 text-[11px] rounded-[6px] px-[6px] py-[2px]">
    {text}
  </span>
));

const RichList = memo(
  ({ title, icon: HeadingIcon, items }: FacilitySection) => (
    <section className="break-inside-avoid">
      <div className="flex items-center gap-2">
        {HeadingIcon && <HeadingIcon className="text-[#5BAE45] text-[18px]" />}
        <h5 className="font-semibold text-[#1A1A1A] leading-tight">{title}</h5>
      </div>
      <ul className="space-y-1 list-none pl-0 mt-[2px] mb-0">
        {items.map((entry, idx) => {
          const data = typeof entry === 'string' ? { label: entry } : entry;
          return (
            <li className="flex items-center gap-2" key={`${title}-${idx}`}>
              <AiOutlineCheck className="text-[#1D69F9]" />
              <span>{data.label}</span>
              {data.tags?.map((tag) => (
                <Chip key={tag} text={tag} />
              ))}
            </li>
          );
        })}
      </ul>
    </section>
  ),
);

RichList.displayName = 'RichList';
Chip.displayName = 'Chip';

export const FacilitiesDrawer = ({ open, onClose }: FacilitiesDrawerProps) => {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-[1000]" onClick={onClose} />
      <aside className="fixed top-12 right-0 h-[90vh] w-[360px] sm:w-[620px] md:w-[720px] bg-white shadow-2xl z-[1001] p-5 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-[18px] font-semibold">Facilities of SULTAN PALACE</h4>
            <p className="text-sm text-gray-600">Great facilities! Review score, 8.8</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-[20px]">✕</button>
        </div>

        <section className="mb-6">
          <h5 className="font-semibold mb-2">Most popular facilities</h5>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-[#323232]">
            {popularFacilities.map(({ icon: Icon, label, special }) => (
              <div
                key={label}
                className={`flex items-center gap-2 ${special === 'link' ? 'text-[#1A1A1A] underline' : 'text-[#1A1A1A]'}`}
              >
                <Icon className="text-[18px] text-[#5BAE45]" />
                <span className="text-[14px] text-[#1A1A1A]">{label}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="columns-1 md:columns-2 pr-2 md:[column-gap:40px] space-y-4 md:space-y-6">
          {[...leftSections, ...rightSections].map((section) => (
            <RichList key={section.title} {...section} />
          ))}
        </div>
      </aside>
    </>
  );
};

export default FacilitiesDrawer;

