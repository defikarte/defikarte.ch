import React, { useState } from 'react';
import iconChevronDownMiddleGreenS from '../../../assets/landingpages/home/icon-chevron-down-middle-green-s.svg';
import iconChevronUpMiddleGreenS from '../../../assets/landingpages/home/icon-chevron-up-middle-green-s.svg';
import { Text } from '../text/Text';

export interface AccordionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

export const Accordion: React.FC<AccordionProps> = ({ title, content, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => setIsOpen(open => !open);

  return (
    <div className="bg-primary-100-white w-[100%] rounded-xl">
      <button
        className="text-lg text-left text-primary-100-green-04 font-medium leading-[150%] flex justify-between w-[100%] cursor-pointer py-4 px-5 items-start"
        aria-expanded={isOpen}
        onClick={toggleAccordion}
      >
        <span className="flex-1">{title}</span>
        <img
          className="ps-5 pt-[3.5px]"
          src={isOpen ? iconChevronUpMiddleGreenS : iconChevronDownMiddleGreenS}
        />
      </button>
      {isOpen && (
        <div className="pb-4 px-5">
          <Text weight="regular" size="small" className="leading-[150%]">
            {content}
          </Text>
        </div>
      )}
    </div>
  );
};
