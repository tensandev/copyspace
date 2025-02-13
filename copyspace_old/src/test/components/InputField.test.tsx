/**
 * コンポーネント (InputField.tsx) のテスト例 (Jest + React Testing Library を使用)
 *  - Jest, React Testing Library (@testing-library/react, @testing-library/jest-dom) をインストールする必要あり
 *  - 例: npm install --dev jest @testing-library/react @testing-library/jest-dom @types/jest
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react'; // React Testing Library の関数を import
import InputField from '@/src/app/components/InputField'; // テスト対象のコンポーネントを import
import '@testing-library/jest-dom'; // Jest で DOM API (toBeInTheDocument など) を使用できるようにする


describe('InputField コンポーネント テスト', () => { // テストスイートを describe で定義

  it('入力フィールドにテキストを入力できる', () => { // テストケースを it で定義
    const { container } = render(<InputField onSendMessage={() => { }} />); // InputField コンポーネントをレンダリング (onSendMessage はモック関数)

    const inputElement = screen.getByRole('textbox') as HTMLInputElement; // role="textbox" の要素 (input 要素) を取得
    expect(inputElement).toBeInTheDocument(); // inputElement がドキュメント内に存在することを確認

    fireEvent.change(inputElement, { target: { value: 'テストメッセージ' } }); // inputElement に change イベントを発火 (テキスト入力)
    expect(inputElement.value).toBe('テストメッセージ'); // inputElement の value 属性が 'テストメッセージ' になっていること

    // container でコンポーネント全体の DOM 構造を確認 (デバッグ用)
    // console.log(container.innerHTML);
  });


  it('送信ボタンをクリックすると onSendMessage 関数が入力値で呼ばれる', () => {
    const mockOnSendMessage = jest.fn(); // モック関数 (jest.fn()) を作成
    render(<InputField onSendMessage={mockOnSendMessage} />); // InputField コンポーネントをレンダリング (onSendMessage にモック関数を渡す)

    const inputElement = screen.getByRole('textbox') as HTMLInputElement; // input 要素を取得
    const sendButtonElement = screen.getByRole('button', { name: '送信' }); // 「送信」というテキストを持つ button 要素を取得

    fireEvent.change(inputElement, { target: { value: '送信メッセージ' } }); // inputElement にテキストを入力
    fireEvent.click(sendButtonElement); // 送信ボタンをクリック

    expect(mockOnSendMessage).toHaveBeenCalledTimes(1); // mockOnSendMessage 関数が 1回呼ばれたこと
    expect(mockOnSendMessage).toHaveBeenCalledWith('送信メッセージ'); // mockOnSendMessage 関数が引数 '送信メッセージ' で呼ばれたこと
  });


  it('送信後、入力フィールドがクリアされる', () => {
    render(<InputField onSendMessage={() => { }} />); // InputField コンポーネントをレンダリング (onSendMessage は空の関数)

    const inputElement = screen.getByRole('textbox') as HTMLInputElement; // input 要素を取得
    const sendButtonElement = screen.getByRole('button', { name: '送信' }); // 送信ボタンを取得

    fireEvent.change(inputElement, { target: { value: 'クリアされるかテスト' } }); // inputElement にテキストを入力
    fireEvent.click(sendButtonElement); // 送信ボタンをクリック

    expect(inputElement.value).toBe(''); // inputElement の value 属性が空文字列 ('') になっていること
  });


  // TODO: バリデーション、エラーハンドリング、UI のテストケースなどを追加
  // 例:
  // - 空文字列で送信ボタンをクリックしても onSendMessage が呼ばれない
  // - 入力値の最大文字数制限のテスト
  // - エラーメッセージ表示のテスト (もしあれば)
  // - ...


});