import Component from '@ember/component';
// @ts-ignore: Ignore import of compiled template
import layout from '../templates/components/while-loading';
import { inject as service } from '@ember/service';
import LoadingService from '../services/loading';

export default class WhileLoading extends Component{
  layout = layout;
  tagName = '';

  @service
  loading!: LoadingService;

};
